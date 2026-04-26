import { useState, useEffect } from 'react';
import { QuizEditorLayout } from './components/layout/QuizEditorLayout';
import { JoinView } from './components/lobby/JoinView';
import { ActiveLobby } from './components/lobby/ActiveLobby';
import { Dashboard } from './components/dashboard/Dashboard';
import type { Player } from './types/lobby';

type ScreenState = 'dashboard' | 'editor' | 'join' | 'lobby';

function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('dashboard');
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
  const gamePin = '123456';

  // Dev feature: simulate players joining when in lobby
  useEffect(() => {
    if (currentScreen === 'lobby') {
      const interval = setInterval(() => {
        setLobbyPlayers((prev) => {
          if (prev.length >= 10) return prev; // cap at 10 for dev
          const id = crypto.randomUUID();
          return [
            ...prev,
            {
              id,
              nickname: `Player ${prev.length + 1}`,
              avatarSeed: id,
              // by default teamId and role are undefined
            },
          ];
        });
      }, 4000); // add a player every 4 seconds
      return () => clearInterval(interval);
    }
  }, [currentScreen]);

  const handleJoin = (pin: string, nickname: string) => {
    alert(`Joined game ${pin} as ${nickname}! (Simulation)`);
  };

  const handleStartQuiz = () => {
    alert('Game Starting! All teams are ready. (Simulation)');
  };

  if (currentScreen === 'dashboard') {
    return (
      <Dashboard
        onCreateQuiz={() => setCurrentScreen('editor')}
        onJoinLobby={() => setCurrentScreen('join')}
        onHostGame={(quizId) => {
          console.log(`Hosting quiz ${quizId}`);
          setLobbyPlayers([]); // Reset players for new lobby
          setCurrentScreen('lobby');
        }}
        onEditQuiz={(quizId) => {
          console.log(`Editing quiz ${quizId}`);
          setCurrentScreen('editor');
        }}
      />
    );
  }

  if (currentScreen === 'editor') {
    return (
      <div className="relative h-screen">
        <QuizEditorLayout />
        {/* Dev Back Button overlay */}
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="absolute bottom-4 left-4 bg-black/50 hover:bg-black text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors z-50"
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  if (currentScreen === 'join') {
    return (
      <div className="relative h-screen">
        <JoinView onJoin={handleJoin} />
        <button
          onClick={() => setCurrentScreen('dashboard')}
          className="absolute bottom-4 left-4 bg-white/20 hover:bg-white text-white hover:text-black px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors z-50"
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  if (currentScreen === 'lobby') {
    return (
      <ActiveLobby
        pin={gamePin}
        players={lobbyPlayers}
        onPlayersChange={setLobbyPlayers}
        onStartQuiz={handleStartQuiz}
        onBackToEditor={() => setCurrentScreen('dashboard')}
      />
    );
  }

  return null;
}

export default App;
