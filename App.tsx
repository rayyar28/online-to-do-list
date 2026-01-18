import React, { useState, useCallback, useEffect } from 'react';
import VoidWorld from './components/VoidWorld';
import InputUI from './components/InputUI';
import SystemShatter from './components/SystemShatter';
import GlitchText from './components/GlitchText';
import { Task, GameState } from './types';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.ACTIVE);

  const handleAddTask = (text: string) => {
    if (gameState === GameState.CLEARED) {
      setGameState(GameState.ACTIVE);
    }
    setTasks(prev => [...prev, { id: uuidv4(), text }]);
  };

  const handleTaskComplete = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleAllCleared = useCallback(() => {
    setGameState(GameState.SHATTERING);
    setTimeout(() => {
      setGameState(GameState.CLEARED);
    }, 1500);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050505]">
      
      {/* Background Text Layer (Visible when shattered) */}
      <div className={`absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-1000 ${gameState === GameState.CLEARED || gameState === GameState.SHATTERING ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <GlitchText text="SYSTEM CLEARED: CONGRATS" />
      </div>

      {/* Physics World Layer (Wrapper to handle stateful clear logic) */}
      {gameState !== GameState.CLEARED && (
         <GameLayer 
            tasks={tasks} 
            onTaskComplete={handleTaskComplete} 
            onTriggerShatter={handleAllCleared}
         />
      )}

      {/* Shatter Overlay */}
      {gameState === GameState.SHATTERING && (
        <SystemShatter />
      )}

      {/* UI Overlay */}
      <InputUI onAddTask={handleAddTask} hasTasks={tasks.length > 0} />
      
      {/* Reset Button */}
      {gameState === GameState.CLEARED && (
        <button 
          onClick={() => {
            setGameState(GameState.ACTIVE);
            setTasks([]);
          }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 px-6 py-2 border border-fuchsia-500 text-fuchsia-500 hover:bg-fuchsia-500 hover:text-white font-mono uppercase tracking-widest transition-colors"
        >
          Reboot System
        </button>
      )}
    </div>
  );
};

// Helper component to manage the clearing logic statefully
const GameLayer: React.FC<{ tasks: Task[], onTaskComplete: (id: string) => void, onTriggerShatter: () => void }> = ({ tasks, onTaskComplete, onTriggerShatter }) => {
   const [hasAddedTasks, setHasAddedTasks] = useState(false);

   useEffect(() => {
     if (tasks.length > 0) setHasAddedTasks(true);
   }, [tasks]);

   const handleAllCleared = () => {
     if (hasAddedTasks) {
       onTriggerShatter();
     }
   };

   return <VoidWorld tasks={tasks} onTaskComplete={onTaskComplete} onAllCleared={handleAllCleared} />;
}

export default App;