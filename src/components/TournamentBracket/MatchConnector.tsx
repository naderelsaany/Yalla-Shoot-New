import React from 'react';

/**
 * Renders the SVG connector lines between a parent match and its two children matches.
 * Uses vectorEffect="non-scaling-stroke" to maintain crisp 2px lines regardless of stretch.
 */
export const MatchConnector = React.memo(() => {
  return (
    <div className="w-full flex justify-center -my-[1px] relative z-0 pointer-events-none">
      <svg 
        className="text-[var(--color-border-subtle)]"
        // The width must be exactly 50% of the wrapper + half the gap between children.
        // Assuming gap is 2rem (32px), half gap is 1rem (16px).
        style={{ width: 'calc(50% + 1rem)', height: '2.5rem' }} 
        preserveAspectRatio="none" 
        viewBox="0 0 100 100"
      >
        <path 
          d="M 50 0 L 50 50 L 0 50 L 0 100 M 50 50 L 100 50 L 100 100" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          vectorEffect="non-scaling-stroke" 
        />
      </svg>
    </div>
  );
});

MatchConnector.displayName = 'MatchConnector';
