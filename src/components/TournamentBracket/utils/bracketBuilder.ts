import { BracketMatch, BracketNodeData } from '../types';

/**
 * Builds a hierarchical tree from a flat list of bracket matches.
 * Finds the root match (e.g., Final) which has no nextMatchId pointing to another match in the list,
 * then recursively finds its children.
 */
export function buildBracketTree(matches: BracketMatch[]): BracketNodeData | null {
  if (!matches || matches.length === 0) return null;

  // Map for O(1) lookups
  const matchMap = new Map<string, BracketMatch>();
  matches.forEach(m => matchMap.set(m.id, m));

  // Find the root(s). A root is a match whose nextMatchId is either null,
  // or points to an ID that is not in our matches list.
  let rootMatch: BracketMatch | undefined = matches.find(
    m => !m.nextMatchId || !matchMap.has(m.nextMatchId)
  );

  // Fallback: If for some reason we have a circular reference or no clear root,
  // just pick the one with "Final" or "النهائي" in its roundName, or the last one.
  if (!rootMatch) {
    rootMatch = matches.find(m => m.roundName.includes('النهائي') || m.roundName.toLowerCase().includes('final')) || matches[matches.length - 1];
  }

  if (!rootMatch) return null;

  // Group matches by nextMatchId to easily find children
  const childrenMap = new Map<string, BracketMatch[]>();
  matches.forEach(m => {
    if (m.nextMatchId) {
      if (!childrenMap.has(m.nextMatchId)) {
        childrenMap.set(m.nextMatchId, []);
      }
      childrenMap.get(m.nextMatchId)!.push(m);
    }
  });

  // Recursive builder
  function buildNode(match: BracketMatch): BracketNodeData {
    const childrenMatches = childrenMap.get(match.id) || [];
    
    // In knockout, there are usually exactly 2 children (home side path, away side path).
    // We sort them to ensure consistent visual order if possible, though order usually depends on external factors.
    // For simplicity, we just process them as they appear.
    const children = childrenMatches.map(child => buildNode(child));

    return {
      match,
      children,
    };
  }

  return buildNode(rootMatch);
}
