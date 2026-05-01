import React, { useMemo, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';

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
  const [playInTeams, setPlayInTeams] = useState(true);
  const [teamCount, setTeamCount] = useState(2);
  const [cbmEnabled, setCbmEnabled] = useState(false);

  const summary = useMemo(() => {
    const modeSummary = !playInTeams
      ? 'Each participant will play on their own scoreline.'
      : `${teamCount} teams will be used in the lobby.`;
    if (!cbmEnabled) {
      return modeSummary;
    }
    return `${modeSummary} Confidence-based marking is enabled.`;
  }, [cbmEnabled, playInTeams, teamCount]);

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
      <div className="w-full max-w-lg overflow-hidden rounded-[16px] bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Host Game</h2>
            <p className="mt-1 text-sm font-medium text-text-secondary">{quizTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-[12px] p-2 text-text-muted transition-all duration-200 hover:bg-background hover:text-text-primary"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPlayInTeams(false)}
              className={`rounded-[14px] border px-4 py-4 text-left transition-all ${
                !playInTeams ? 'border-indigo bg-indigo/10 text-text-primary' : 'border-border bg-white text-text-secondary'
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em]">Solo</p>
              <p className="mt-2 text-sm font-medium">One player per scoreline.</p>
            </button>
            <button
              onClick={() => setPlayInTeams(true)}
              className={`rounded-[14px] border px-4 py-4 text-left transition-all ${
                playInTeams ? 'border-indigo bg-indigo/10 text-text-primary' : 'border-border bg-white text-text-secondary'
              }`}
            >
              <p className="text-sm font-bold uppercase tracking-[0.18em]">Teams</p>
              <p className="mt-2 text-sm font-medium">Players are grouped before the game starts.</p>
            </button>
          </div>

          {playInTeams && (
            <div className="rounded-[14px] border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-text-primary">Number of teams</p>
                  <p className="mt-1 text-sm text-text-secondary">The room will require at least two players per team.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateTeamCount(-1)}
                    disabled={teamCount <= 2}
                    className="rounded-[12px] border border-border bg-white p-2 text-text-primary disabled:opacity-50"
                  >
                    <Minus size={18} />
                  </button>
                  <div className="min-w-14 rounded-[12px] bg-white px-4 py-2 text-center text-xl font-black text-text-primary">
                    {teamCount}
                  </div>
                  <button
                    onClick={() => updateTeamCount(1)}
                    disabled={teamCount >= 8}
                    className="rounded-[12px] border border-border bg-white p-2 text-text-primary disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[14px] border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-text-primary">Confidence-based marking</p>
                <p className="mt-1 text-sm text-text-secondary">Captains must choose confidence before confirming an answer.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={cbmEnabled}
                onClick={() => setCbmEnabled((current) => !current)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                  cbmEnabled ? 'bg-indigo' : 'bg-border'
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

          <div className="rounded-[14px] bg-background px-4 py-3 text-sm font-semibold text-text-secondary">
            {summary}
          </div>
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 rounded-[12px] border-2 border-border text-text-secondary transition-all duration-200 hover:bg-background"
          >
            Cancel
          </button>
          <button
            onClick={() => onStart({ playInTeams, teamCount: playInTeams ? teamCount : null, cbmEnabled })}
            className="btn-secondary flex-1 rounded-[12px] bg-teal text-white transition-all duration-200 hover:bg-teal-dark"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};
