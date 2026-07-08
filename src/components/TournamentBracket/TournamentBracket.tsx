'use client';

import React, { useMemo } from 'react';
import { BracketMatch } from './types';
import { buildBracketTree } from './utils/bracketBuilder';
import { BracketNode } from './BracketNode';
import { useDraggableScroll } from './hooks/useDraggableScroll';

interface TournamentBracketProps {
  matches: BracketMatch[];
  tournamentName?: string;
}

export const TournamentBracket = React.memo(({ matches, tournamentName = "البطولة" }: TournamentBracketProps) => {
  // Build the tree only when matches change
  const rootNode = useMemo(() => buildBracketTree(matches), [matches]);

  // Hook for drag-to-scroll on desktop/tablet/mobile
  const { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove, isDragging } = useDraggableScroll<HTMLDivElement>();

  if (!rootNode) {
    return (
      <div className="flex items-center justify-center p-12 bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
        لا توجد بيانات كافية لعرض الشجرة.
      </div>
    );
  }

  return (
    <div className="w-full font-tajawal">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)]">
          شجرة أدوار {tournamentName}
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm mt-2">
          اسحب يميناً أو يساراً للتنقل بين الأدوار
        </p>
      </div>

      {/* Bracket Container with Drag to Scroll */}
      <div 
        ref={ref}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className={`w-full overflow-x-auto pb-8 pt-4 no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ overscrollBehaviorX: 'contain' }} // Prevent browser back/forward on mobile swipe
      >
        <div className="min-w-max px-4 mx-auto flex justify-center pb-8">
          <BracketNode node={rootNode} isRoot={true} />
        </div>
      </div>
      
    </div>
  );
});

TournamentBracket.displayName = 'TournamentBracket';
