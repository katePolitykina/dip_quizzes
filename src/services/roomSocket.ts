import { isSessionExpired, readAuthSession } from '../lib/authStorage';
import { appConfig } from '../config/appConfig';
import type { SocketEnvelope } from '../types/api';

function getWebSocketUrl() {
  if (appConfig.wsBaseUrl) {
    return `${appConfig.wsBaseUrl}/ws`;
  }

  const base = appConfig.apiBaseUrl
    ? appConfig.apiBaseUrl.replace(/^http/, 'ws')
    : window.location.origin.replace(/^http/, 'ws');

  return `${base}/ws`;
}

function buildFrame(command: string, headers: Record<string, string>, body = '') {
  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${key}:${value}`)
    .join('\n');
  return `${command}\n${headerLines}\n\n${body}\0`;
}

function parseFrames(raw: string) {
  return raw
    .split('\0')
    .map((frame) => frame.trim())
    .filter(Boolean)
    .map((frame) => {
      const [headerBlock, ...bodyLines] = frame.split('\n\n');
      const [command, ...headerLines] = headerBlock.split('\n');
      const headers = headerLines.reduce<Record<string, string>>((accumulator, line) => {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex > -1) {
          accumulator[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
        }
        return accumulator;
      }, {});

      return {
        command,
        headers,
        body: bodyLines.join('\n\n'),
      };
    });
}

interface RoomSocketOptions {
  pin: string;
  onEnvelope: (envelope: SocketEnvelope) => void;
  onConnectionChange: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;
  onError: (message: string) => void;
  onUnauthorized: () => void;
  onKicked: () => void;
}

export class RoomSocketClient {
  private ws: WebSocket | null = null;
  private readonly options: RoomSocketOptions;
  private reconnectAttempts = 0;
  private subscriptions = new Set<string>();
  private pendingSubscriptions = new Set<string>();
  private reconnectTimer: number | null = null;
  private intentionalClose = false;

  constructor(options: RoomSocketOptions) {
    this.options = options;
  }

  connect() {
    const session = readAuthSession();
    if (!session || isSessionExpired(session)) {
      this.options.onUnauthorized();
      return;
    }

    this.options.onConnectionChange(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
    this.intentionalClose = false;
    this.ws = new WebSocket(getWebSocketUrl());

    this.ws.onopen = () => {
      this.ws?.send(buildFrame('CONNECT', {
        'accept-version': '1.2',
        'heart-beat': '10000,10000',
        Authorization: `Bearer ${session.accessToken}`,
      }));
    };

    this.ws.onmessage = (event) => {
      const frames = parseFrames(String(event.data));
      frames.forEach((frame) => {
        if (frame.command === 'CONNECTED') {
          this.reconnectAttempts = 0;
          this.options.onConnectionChange('connected');
          this.subscribe(`/topic/rooms/${this.options.pin}`);
          this.pendingSubscriptions.forEach((destination) => this.subscribe(destination));
          return;
        }

        if (frame.command === 'MESSAGE') {
          try {
            this.options.onEnvelope(JSON.parse(frame.body) as SocketEnvelope);
          } catch {
            this.options.onError('Received an invalid socket payload.');
          }
          return;
        }

        if (frame.command === 'ERROR') {
          if (frame.body.includes('Unauthorized') || frame.body.includes('Missing WebSocket bearer token')) {
            this.options.onUnauthorized();
            return;
          }
          this.options.onError(frame.body || 'WebSocket broker rejected the frame.');
        }
      });
    };

    this.ws.onclose = (event) => {
      this.options.onConnectionChange('disconnected');
      if (this.reconnectTimer != null) {
        window.clearTimeout(this.reconnectTimer);
      }
      if (this.intentionalClose) {
        return;
      }
      if (event.code === 1008) {
        this.options.onKicked();
        return;
      }
      const currentSession = readAuthSession();
      if (!currentSession || isSessionExpired(currentSession)) {
        this.options.onUnauthorized();
        return;
      }
      const backoffMs = Math.min(5000, 500 * 2 ** this.reconnectAttempts);
      this.reconnectAttempts += 1;
      this.reconnectTimer = window.setTimeout(() => this.connect(), backoffMs);
    };

    this.ws.onerror = () => {
      this.options.onError('WebSocket connection failed.');
    };
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.subscriptions.clear();
  }

  subscribe(destination: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.pendingSubscriptions.add(destination);
      return;
    }
    if (this.subscriptions.has(destination)) {
      return;
    }
    const id = `sub-${destination}`;
    this.ws.send(buildFrame('SUBSCRIBE', { id, destination }));
    this.subscriptions.add(destination);
    this.pendingSubscriptions.delete(destination);
  }

  send(destination: string, body?: unknown) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Socket is not connected');
    }
    this.ws.send(buildFrame(
      'SEND',
      {
        destination,
        'content-type': 'application/json',
      },
      body ? JSON.stringify(body) : ''
    ));
  }
}
