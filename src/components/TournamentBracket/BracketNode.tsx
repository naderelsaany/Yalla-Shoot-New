import React from 'react';
import { BracketNodeData } from './types';
import { MatchCard } from './MatchCard';
import { MatchConnector } from './MatchConnector';

interface BracketNodeProps {
  node: BracketNodeData;
  isRoot?: boolean;
}

export const BracketNode = React.memo(({ node, isRoot = false }: BracketNodeProps) => {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={`flex flex-col items-center ${isRoot ? '' : 'flex-1'}`}>
      
      {/* The Match Card */}
      <div className="z-10 w-[280px] sm:w-[320px]">
        <MatchCard match={node.match} />
      </div>
      
      {/* The SVG Connector (Only if there are children) */}
      {hasChildren && <MatchConnector />}
      
      {/* The Children (Previous Rounds that fed into this match) */}
      {hasChildren && (
        <div className="flex gap-4 sm:gap-8 w-full justify-center">
          {node.children.map((child, index) => (
            <BracketNode key={child.match.id || index} node={child} />
          ))}
        </div>
      )}
      
    </div>
  );
});

BracketNode.displayName = 'BracketNode';
