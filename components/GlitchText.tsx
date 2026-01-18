import React from 'react';

const GlitchText: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="relative inline-block group">
      <h1 className="text-6xl md:text-8xl font-bold text-white relative z-10 animate-pulse tracking-tighter">
        {text}
      </h1>
      
      {/* Glitch Layer 1 (Cyan) */}
      <h1 
        className="text-6xl md:text-8xl font-bold text-cyan-400 absolute top-0 left-0 -z-10 opacity-70 animate-[glitch-1_2s_infinite]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)', transform: 'translate(-2px, -2px)' }}
      >
        {text}
      </h1>

      {/* Glitch Layer 2 (Magenta) */}
      <h1 
        className="text-6xl md:text-8xl font-bold text-fuchsia-500 absolute top-0 left-0 -z-10 opacity-70 animate-[glitch-2_2s_infinite]"
        style={{ clipPath: 'polygon(0 80%, 100% 20%, 100% 100%, 0 100%)', transform: 'translate(2px, 2px)' }}
      >
        {text}
      </h1>

      <style>{`
        @keyframes glitch-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes glitch-2 {
          0% { transform: translate(0); }
          20% { transform: translate(2px, -2px); }
          40% { transform: translate(2px, 2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(-2px, 2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
};

export default GlitchText;