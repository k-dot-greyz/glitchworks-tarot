import React from 'react';

export const GlitchStyles = () => (
  <style>{`
    :root {
      --glitch-int: 0.5;
      --crt-opacity: 0.3;
      --noise-opacity: 0.15;
      --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
    }

    .crt-overlay {
      pointer-events: none;
      position: fixed;
      inset: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                  linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      background-size: 100% 4px, 6px 100%;
      z-index: 9999;
      opacity: var(--crt-opacity);
      mix-blend-mode: overlay;
    }

    .noise-overlay {
      pointer-events: none;
      position: fixed;
      inset: 0;
      background-image: url('https://grainy-gradients.vercel.app/noise.svg');
      opacity: var(--noise-opacity);
      z-index: 0;
      mix-blend-mode: multiply;
    }

    @keyframes rgb-split {
      0% { text-shadow: calc(var(--glitch-int) * -4px) 0 red, calc(var(--glitch-int) * 4px) 0 cyan; }
      25% { text-shadow: calc(var(--glitch-int) * 4px) 0 red, calc(var(--glitch-int) * -4px) 0 cyan; }
      50% { text-shadow: calc(var(--glitch-int) * -2px) 0 red, calc(var(--glitch-int) * 2px) 0 cyan; }
      75% { text-shadow: calc(var(--glitch-int) * 2px) 0 red, calc(var(--glitch-int) * -2px) 0 cyan; }
      100% { text-shadow: calc(var(--glitch-int) * -4px) 0 red, calc(var(--glitch-int) * 4px) 0 cyan; }
    }

    .glitch-hover:hover {
      animation: rgb-split 0.2s steps(2, end) infinite;
    }

    .glitch-text {
      text-shadow: calc(var(--glitch-int) * 2px) 0px 0px rgba(255,0,0,0.5), 
                   calc(var(--glitch-int) * -2px) 0px 0px rgba(0,255,255,0.5);
    }

    @keyframes data-collision {
      0%, 100% { transform: translate3d(0, 0, 0); filter: none; }
      10%, 90% { transform: translate3d(-4px, 0, 0) skewX(-2deg); }
      20%, 80% { transform: translate3d(8px, 0, 0) skewX(2deg); filter: hue-rotate(90deg) contrast(150%); }
      30%, 50%, 70% { transform: translate3d(-12px, 2px, 0) skewX(-4deg); }
      40%, 60% { transform: translate3d(12px, -2px, 0) skewX(4deg); filter: invert(1) drop-shadow(0 0 20px red); }
    }

    .animate-collision {
      animation: data-collision 0.6s cubic-bezier(.36,.07,.19,.97) both;
    }

    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);
