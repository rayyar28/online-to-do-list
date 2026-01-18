import React, { useState } from 'react';

interface InputUIProps {
  onAddTask: (text: string) => void;
  hasTasks: boolean;
}

const InputUI: React.FC<InputUIProps> = ({ onAddTask, hasTasks }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAddTask(text);
      setText('');
    }
  };

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-md z-30 px-4">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="INIT_PROTOCOL: ADD_TASK..."
          className="w-full bg-black/80 border-2 border-cyan-500/50 text-cyan-400 placeholder-cyan-800 p-4 font-mono text-lg outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 bottom-2 px-4 bg-cyan-900/30 text-cyan-400 border border-cyan-500 hover:bg-cyan-400 hover:text-black transition-colors font-bold tracking-widest uppercase text-sm"
        >
          Inject
        </button>
      </form>
      {!hasTasks && (
        <div className="text-center mt-4 text-fuchsia-500/50 text-sm animate-pulse">
          // SYSTEM IDLE. AWAITING INPUT.
        </div>
      )}
    </div>
  );
};

export default InputUI;