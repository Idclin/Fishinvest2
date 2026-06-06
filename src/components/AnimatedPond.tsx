import React from 'react';
import { motion } from 'motion/react';
import { FishType, FISH_SPECS } from '../types.ts';

interface AnimatedPondProps {
  holdings: {
    fishType: FishType;
    quantity: number;
  }[];
}

export default function AnimatedPond({ holdings }: AnimatedPondProps) {
  // Flatten holdings so we render exactly the number of fish owned
  const fishes = React.useMemo(() => {
    const list: FishType[] = [];
    holdings.forEach((h) => {
      for (let i = 0; i < h.quantity; i++) {
        list.push(h.fishType);
      }
    });
    return list;
  }, [holdings]);

  // Generate random floating animations parameters for each fish
  const fishPositions = React.useMemo(() => {
    return fishes.map(() => ({
      top: Math.floor(15 + Math.random() * 55), // 15% to 70%
      left: Math.floor(10 + Math.random() * 75), // 10% to 85%
      scale: 0.6 + Math.random() * 0.5,
      yDuration: 3 + Math.random() * 3, // 3s to 6s
      xDuration: 4 + Math.random() * 4,
      yRange: [0, -15 - Math.random() * 15, 0],
      xRange: [0, 10 + Math.random() * 15, 0],
    }));
  }, [fishes.length]);

  return (
    <div className="w-full h-56 rounded-2xl bg-brand-box border border-cyan-900/40 overflow-hidden relative shadow-inner">
      {/* Dynamic Animated Bubbles */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        {Array.from({ length: 15 }).map((_, idx) => {
          const size = Math.floor(4 + Math.random() * 10);
          const duration = 4 + Math.random() * 6;
          const left = Math.floor(Math.random() * 100);
          return (
            <motion.div
              key={idx}
              className="absolute bottom-[-20px] rounded-full bg-cyan-400/20 shadow-inner border border-white/10"
              style={{
                width: size,
                height: size,
                left: `${left}%`
              }}
              animate={{
                y: [-20, -260],
                x: [0, (idx % 2 === 0 ? 15 : -15), 0],
                opacity: [0, 0.8, 0]
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay: idx * 0.4,
                ease: 'easeInOut'
              }}
            />
          );
        })}
      </div>

      {/* Underwater light beams effect */}
      <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-cyan-500/10 to-transparent clip-path-beams opacity-40 pointer-events-none" />

      {/* Header Badge */}
      <div className="absolute top-3 left-3 z-10 px-3 py-1 rounded-full bg-cyan-950/55 backdrop-blur-md border border-cyan-500/20 text-[10px] font-mono text-cyan-300 uppercase tracking-widest">
        🌊 Live Pond: {fishes.length} fish swimming
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {fishes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            className="text-center text-slate-500 p-6 flex flex-col items-center gap-2 select-none"
          >
            <div className="text-3xl">🏜️</div>
            <p className="text-xs font-sans">Your pond is currently empty. Visit the Market to claim your first farming stock!</p>
          </motion.div>
        ) : (
          <div className="w-full h-full relative">
            {fishes.map((type, idx) => {
              const spec = FISH_SPECS[type];
              const pos = fishPositions[idx] || {
                top: 40,
                left: 40,
                scale: 1,
                yDuration: 4,
                xDuration: 5,
                yRange: [0, -10, 0],
                xRange: [0, 10, 0]
              };
              
              return (
                <motion.div
                  key={idx}
                  className="absolute cursor-pointer select-none group"
                  style={{
                    top: `${pos.top}%`,
                    left: `${pos.left}%`,
                    transform: `scale(${pos.scale})`
                  }}
                  animate={{
                    y: pos.yRange,
                    x: pos.xRange,
                    rotate: [0, idx % 2 === 0 ? 5 : -5, 0]
                  }}
                  transition={{
                    y: { duration: pos.yDuration, repeat: Infinity, ease: 'easeInOut' },
                    x: { duration: pos.xDuration, repeat: Infinity, ease: 'easeInOut' },
                    rotate: { duration: pos.yDuration * 1.2, repeat: Infinity, ease: 'easeInOut' }
                  }}
                >
                  <div className="relative">
                    {/* Glowing aura around fish */}
                    <div 
                      className="absolute inset-0 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity" 
                      style={{ backgroundColor: spec.color }}
                    />
                    
                    <img
                      src={spec.image}
                      alt={spec.displayName}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-contain relative z-10 filter drop-shadow-lg scale-x-[-1] group-hover:scale-110 transition-transform duration-200"
                    />
                    
                    {/* Tooltip on hover */}
                    <span className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-brand-bg border border-cyan-500/35 text-[8px] font-mono whitespace-nowrap text-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                      {spec.displayName}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .clip-path-beams {
          clip-path: polygon(10% 0%, 20% 0%, 55% 100%, 45% 100%);
        }
      `}</style>
    </div>
  );
}
