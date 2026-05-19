import React, { useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export interface HostGameSettings {
  playInTeams: boolean;
  teamCount: number | null;
  cbmEnabled: boolean;
}

interface HostGameModalProps {
  quizTitle: string;
  onStart: (settings: HostGameSettings) => void;
  onClose: () => void;
}

export const HostGameModal: React.FC<HostGameModalProps> = ({ quizTitle, onStart, onClose }) => {
  const { messages } = useI18n();
  const [playInTeams, setPlayInTeams] = useState(true);
  const [teamCount, setTeamCount] = useState(2);
  const [cbmEnabled, setCbmEnabled] = useState(false);

  const summary = useMemo(() => {
    const modeSummary = !playInTeams
      ? messages.dashboard.hostGameSummarySolo
      : messages.dashboard.hostGameSummaryTeams(teamCount);
    if (!cbmEnabled) {
      return modeSummary;
    }
    return messages.dashboard.hostGameSummaryCbm(modeSummary);
  }, [cbmEnabled, playInTeams, teamCount, messages]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const updateTeamCount = (delta: number) => {
    setTeamCount((current) => Math.min(8, Math.max(2, current + delta)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/45 backdrop-blur-sm p-4" onClick={handleBackdropClick}>
      <div className="glass-overlay w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">{messages.dashboard.hostGameTitle}</h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">{quizTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary btn-glass min-h-0 rounded-full p-2 text-text-muted"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlayInTeams(false)}
              className={`rounded-[16px] border px-4 py-4 text-left transition-all ${
                !playInTeams ? 'border-[var(--color-indigo)] bg-[rgba(249,168,212,0.18)] text-text-primary' : 'glass-inset text-text-secondary'
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em]">{messages.dashboard.solo}</p>
              <p className="mt-2 text-sm font-medium">{messages.dashboard.soloDescription}</p>
            </button>
            <button
              onClick={() => setPlayInTeams(true)}
              className={`rounded-[16px] border px-4 py-4 text-left transition-all ${
                playInTeams ? 'border-[var(--color-indigo)] bg-[rgba(249,168,212,0.18)] text-text-primary' : 'glass-inset text-text-secondary'
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em]">{messages.dashboard.teams}</p>
              <p className="mt-2 text-sm font-medium">{messages.dashboard.teamsDescription}</p>
            </button>
          </div>

          {playInTeams && (
            <div className="glass-inset rounded-[16px] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">{messages.dashboard.numberOfTeams}</p>
                  <p className="mt-1 text-sm text-text-secondary">{messages.dashboard.roomRequiresTwoPlayers}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateTeamCount(-1)}
                    disabled={teamCount <= 2}
                    className="btn-secondary btn-glass min-h-0 rounded-full p-2 text-text-primary disabled:opacity-50"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="glass-inset min-w-14 rounded-full px-4 py-2 text-center text-xl font-black text-text-primary">
                    {teamCount}
                  </div>
                  <button
                    onClick={() => updateTeamCount(1)}
                    disabled={teamCount >= 8}
                    className="btn-secondary btn-glass min-h-0 rounded-full p-2 text-text-primary disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="glass-inset rounded-[16px] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text-primary">{messages.dashboard.confidenceBasedMarking}</p>
                <p className="mt-1 text-sm text-text-secondary">{messages.dashboard.captainsMustChooseConfidence}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cbmEnabled}
                onClick={() => setCbmEnabled((current) => !current)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  cbmEnabled ? 'bg-[var(--color-midnight)]' : 'bg-white/80'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                    cbmEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="glass-inset rounded-[16px] px-4 py-3 text-sm font-semibold text-text-secondary">
            {summary}
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="btn-secondary btn-glass flex-1"
          >
            {messages.dashboard.cancel}
          </button>
          <button
            onClick={() => onStart({ playInTeams, teamCount: playInTeams ? teamCount : null, cbmEnabled })}
            className="btn-secondary btn-cta flex-1"
          >
            {messages.dashboard.createRoom}
          </button>
        </div>
      </div>
    </div>
  );
};
