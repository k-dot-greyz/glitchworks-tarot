export const GlitchOverlays = () => (
  <>
    <div className="noise-overlay" aria-hidden="true">
      <svg className="noise-overlay__svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <filter id="aether-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="4"
            stitchTiles="stitch"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#aether-grain)" opacity="0.55" />
      </svg>
    </div>
    <div className="crt-overlay" aria-hidden="true" />
  </>
);

export const GlitchStyles = GlitchOverlays;
