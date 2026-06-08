import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FishType, FISH_SPECS } from '../types.ts';
import { resolveImageUrl } from '../utils.ts';

interface AnimatedPondProps {
  holdings: {
    fishType: FishType;
    quantity: number;
  }[];
  marketCatalog?: any[];
}

export default function AnimatedPond({ holdings, marketCatalog = [] }: AnimatedPondProps) {
  // Flatten holdings so we render exactly the number of fish owned
  const fishes = React.useMemo(() => {
    const list: FishType[] = [];
    holdings.forEach((h) => {
      // Loop exactly 'quantity' times so every staked fish has a swimming representation
      for (let i = 0; i < h.quantity; i++) {
        list.push(h.fishType);
      }
    });
    return list;
  }, [holdings]);

  // Aggregate kinds and quantities of active fish in high-polish list
  const speciesSummary = React.useMemo(() => {
    const counts: Record<string, { spec: any; count: number }> = {};
    holdings.forEach((h) => {
      const type = h.fishType;
      const spec = FISH_SPECS[type] || (() => {
        const custom = marketCatalog.find((m: any) => m.name === type || m.id === type);
        if (!custom) return null;
        return {
          displayName: custom.displayName,
          image: custom.image || custom.photo_url || custom.photoUrl,
          price: custom.price,
          color: '#22d3ee', // bright cyan
        };
      })();
      if (spec) {
        if (!counts[type]) {
          counts[type] = { spec, count: 0 };
        }
        counts[type].count += h.quantity;
      }
    });
    return Object.values(counts);
  }, [holdings, marketCatalog]);

  // Handle subtle interactive wiggle animations on touch/click using CSS classes
  const [wiggleIdx, setWiggleIdx] = React.useState<number | null>(null);

  const handleInteractWithFish = (idx: number) => {
    setWiggleIdx(idx);
    setTimeout(() => {
      setWiggleIdx(null);
    }, 850);
  };

  // Dynamically scale down items if there is a big collection swimming (>= 20 assets)
  const dynamicScalingFactor = React.useMemo(() => {
    if (fishes.length > 35) return 0.45;
    if (fishes.length > 20) return 0.6;
    if (fishes.length > 10) return 0.8;
    return 1.0;
  }, [fishes.length]);

  return (
    <div className="w-full relative">
      {/* Background container representing the visual deep water tank aspect */}
      <div className="w-full h-80 rounded-3xl bg-gradient-to-b from-brand-box to-brand-bg/95 border border-cyan-500/20 overflow-hidden relative shadow-[inset_0_4px_30px_rgba(6,182,212,0.15)] flex flex-col justify-between">
        
        {/* Dynamic Animated Water Bubbles */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          {Array.from({ length: 18 }).map((_, idx) => {
            const size = Math.floor(3 + Math.random() * 9);
            const duration = 5 + Math.random() * 7;
            const left = Math.floor(Math.random() * 100);
            return (
              <motion.div
                key={`bubble-${idx}`}
                className="absolute bottom-[-15px] rounded-full bg-cyan-400/30 shadow-inner border border-white/5"
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`
                }}
                animate={{
                  y: [-15, -315],
                  x: [0, (idx % 2 === 0 ? 12 : -12), 0],
                  opacity: [0, 0.85, 0]
                }}
                transition={{
                  duration,
                  repeat: Infinity,
                  delay: idx * 0.3,
                  ease: 'easeInOut'
                }}
              />
            );
          })}
        </div>

        {/* Dynamic light shaft element overlay */}
        <div className="absolute top-0 inset-x-0 h-full bg-gradient-to-b from-cyan-400/10 via-cyan-500/[0.02] to-transparent clip-path-beams opacity-55 pointer-events-none z-0" />

        {/* Header HUD: Active tracker showing sum of items */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-cyan-500/20 text-[10px] font-mono text-cyan-200 uppercase tracking-widest flex items-center gap-2 shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          🌊 LIVE POND: {fishes.length} {fishes.length === 1 ? 'FISH' : 'FISHES'} SWIMMING
        </div>

        {/* Main Stage Panel Area */}
        <div className="w-full h-full relative z-10">
          <AnimatePresence>
            {fishes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none"
              >
                <div className="text-4xl animate-bounce duration-[3000ms]">🏜️</div>
                <h5 className="font-sans font-bold text-xs text-slate-300 mt-2">Pond is currently vacant</h5>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1 font-sans">Stake breeding stock from the fish market to watch them swim, feed, and grow until Sunday harvest!</p>
              </motion.div>
            ) : (
              <div className="w-full h-full relative">
                {fishes.map((type, idx) => {
                  const spec = FISH_SPECS[type] || (() => {
                    const custom = marketCatalog.find((m: any) => m.name === type || m.id === type);
                    if (!custom) return null;
                    return {
                      displayName: custom.displayName,
                      image: custom.image || custom.photo_url || custom.photoUrl,
                      price: custom.price,
                      color: '#06b6d4',
                    };
                  })();
                  if (!spec) return null;

                  // Determine path variety (1 to 4) using modulus index
                  const swimPathID = (idx % 4) + 1;

                  // Vary speed logic depending on the total count / index to avoid unison pacing
                  const baseDuration = 18 + (idx % 6) * 4; // 18s to 38s loops
                  // Stagger start location immediately with a negative animation-delay
                  const delay = (idx % 7) * -5.3;

                  // Scale variation for realism
                  const scaleValue = (0.75 + (idx % 4) * 0.12) * dynamicScalingFactor;

                  const isWiggling = wiggleIdx === idx;

                  return (
                    <div
                      key={`fish-instance-${idx}`}
                      onClick={() => handleInteractWithFish(idx)}
                      className={`absolute cursor-pointer select-none group focus:outline-none swim-agent-path-${swimPathID} swim-pause-hover`}
                      style={{
                        animationDuration: `${baseDuration}s`,
                        animationDelay: `${delay}s`,
                        width: '48px',
                        height: '48px',
                      }}
                    >
                      <div 
                        className={`relative w-full h-full flex items-center justify-center transition-all duration-300 ${isWiggling ? 'css-action-wiggle' : ''}`}
                        style={{
                          transform: `scale(${scaleValue})`,
                        }}
                      >
                        {/* Soft ambient water glow aura to amplify three-dimensional depth */}
                        <div 
                          className="absolute -inset-2 rounded-full blur-md opacity-25 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" 
                          style={{ backgroundColor: spec.color || '#06b6d4' }}
                        />
                        
                        <img
                          src={resolveImageUrl(spec.image) || undefined}
                          alt={spec.displayName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-contain relative z-10 filter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)] transform hover:scale-110 transition-transform duration-200"
                          onError={(e) => {
                            e.currentTarget.src = FISH_SPECS.meluza.image;
                          }}
                        />

                        {/* Speech bubbles indicating interaction wiggles */}
                        {isWiggling && (
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 bg-cyan-950 border border-cyan-400 text-cyan-200 text-[8px] font-bold font-mono px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap animate-bounce">
                            🫧 pop!
                          </div>
                        )}
                        
                        {/* Elegant float metadata tag */}
                        <span className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-slate-950/90 border border-cyan-500/20 text-[7px] font-mono whitespace-nowrap text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 shadow-md pointer-events-none">
                          {spec.displayName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Horizontal Stock Counter Legend (the user's specific kinds & quantity listing overlay) */}
        {speciesSummary.length > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center gap-2 max-h-16 overflow-y-auto pr-1">
            {speciesSummary.map((item, index) => (
              <div 
                key={`legend-${index}`}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-cyan-500/10 shadow-md text-[9px] font-sans text-cyan-100 hover:border-cyan-400/40 transition duration-300 select-none cursor-help"
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full animate-bounce" 
                  style={{ backgroundColor: item.spec.color || '#22d3ee' }}
                />
                <img 
                  src={resolveImageUrl(item.spec.image) || undefined} 
                  alt={item.spec.displayName} 
                  className="w-4 h-4 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = FISH_SPECS.meluza.image;
                  }}
                />
                <span className="font-semibold text-slate-300">{item.spec.displayName}</span>
                <span className="bg-cyan-950 border border-cyan-500/20 px-1 py-0.2 rounded font-mono font-black text-cyan-300">
                  x{item.count}
                </span>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Embedded High Performance CSS Swim Paths (Simulating complete side-to-side swimming across the water tank container) */}
      <style>{`
        .clip-path-beams {
          clip-path: polygon(15% 0%, 30% 0%, 65% 100%, 50% 100%);
        }

        /* Hover pauses swim and lifts the hovered fish layer */
        .swim-pause-hover {
          transition: z-index 0.2s ease;
        }
        .swim-pause-hover:hover {
          animation-play-state: paused !important;
          z-index: 50 !important;
        }

        /* Wiggle CSS Micro animations */
        @keyframes css-wiggle-key {
          0%, 100% { transform: scale(1.0) rotate(0deg); }
          20% { transform: scale(1.35) rotate(-18deg); }
          40% { transform: scale(1.25) rotate(18deg); }
          60% { transform: scale(1.3) rotate(-10deg); }
          80% { transform: scale(1.15) rotate(10deg); }
        }
        .css-action-wiggle {
          animation: css-wiggle-key 0.8s ease-in-out !important;
        }

        /* Path 1: Sine Wave Swim Left to Right & Flip Back */
        @keyframes swim-key-1 {
          0% { left: -15%; top: 18%; transform: scaleX(1); }
          25% { top: 28%; }
          48% { transform: scaleX(1); }
          50% { left: 108%; top: 22%; transform: scaleX(-1); }
          75% { top: 32%; }
          98% { transform: scaleX(-1); }
          100% { left: -15%; top: 18%; transform: scaleX(1); }
        }
        .swim-agent-path-1 {
          animation: swim-key-1 22s infinite linear;
        }

        /* Path 2: Flat Deep Water Cruise Right to Left & Flip Back */
        @keyframes swim-key-2 {
          0% { left: 108%; top: 58%; transform: scaleX(-1); }
          30% { top: 52%; }
          48% { transform: scaleX(-1); }
          50% { left: -15%; top: 48%; transform: scaleX(1); }
          80% { top: 54%; }
          98% { transform: scaleX(1); }
          100% { left: 108%; top: 58%; transform: scaleX(-1); }
        }
        .swim-agent-path-2 {
          animation: swim-key-2 26s infinite linear;
        }

        /* Path 3: Angular Rising and Diving Path Left to Right & Flip Back */
        @keyframes swim-key-3 {
          0% { left: -15%; top: 62%; transform: scaleX(1) rotate(5deg); }
          25% { top: 35%; transform: scaleX(1) rotate(-8deg); }
          48% { transform: scaleX(1); }
          50% { left: 108%; top: 54%; transform: scaleX(-1) rotate(5deg); }
          75% { top: 28%; transform: scaleX(-1) rotate(-8deg); }
          98% { transform: scaleX(-1); }
          100% { left: -15%; top: 62%; transform: scaleX(1) rotate(5deg); }
        }
        .swim-agent-path-3 {
          animation: swim-key-3 19s infinite linear;
        }

        /* Path 4: Central Double Loop Path (Dynamic center cruise with vertical wave) */
        @keyframes swim-key-4 {
          0% { left: -15%; top: 38%; transform: scaleX(1); }
          30% { left: 40%; top: 18%; transform: scaleX(1) rotate(-12deg); }
          48% { transform: scaleX(1); }
          50% { left: 108%; top: 44%; transform: scaleX(-1); }
          80% { left: 55%; top: 62%; transform: scaleX(-1) rotate(12deg); }
          98% { transform: scaleX(-1); }
          100% { left: -15%; top: 38%; transform: scaleX(1); }
        }
        .swim-agent-path-4 {
          animation: swim-key-4 31s infinite linear;
        }
      `}</style>
    </div>
  );
}
