// Timeline Utilities - Helper functions for timeline operations
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

// Color scheme for timeline entries
export const timelineColorScale = scaleOrdinal(schemeCategory10);

// Calculate zigzag positions for timeline entries
export const calculateZigzagPositions = (entries, containerWidth = 600, containerHeight = 800) => {
  const centerX = containerWidth / 2;
  const startY = 100;
  const verticalSpacing = 120;
  const horizontalOffset = 150;

  return entries.map((entry, index) => {
    const isEven = index % 2 === 0;
    return {
      ...entry,
      x: centerX + (isEven ? -horizontalOffset : horizontalOffset),
      y: startY + (index * verticalSpacing),
      bend: isEven ? 'left' : 'right' // For card positioning
    };
  });
};

// Generate timeline path coordinates for canvas drawing
export const generateTimelinePath = (positions) => {
  if (positions.length < 2) return [];

  const path = [];
  for (let i = 0; i < positions.length - 1; i++) {
    const current = positions[i];
    const next = positions[i + 1];
    
    const midY = (current.y + next.y) / 2;
    
    path.push({
      from: { x: current.x, y: current.y },
      to: { x: current.x, y: midY },
      type: 'vertical'
    });
    
    path.push({
      from: { x: current.x, y: midY },
      to: { x: next.x, y: midY },
      type: 'horizontal'
    });
    
    path.push({
      from: { x: next.x, y: midY },
      to: { x: next.x, y: next.y },
      type: 'vertical'
    });
  }
  
  return path;
};

// Calculate card positions based on node position and bend direction
export const calculateCardPosition = (node, cardType, offset = 20) => {
  const isLeft = node.bend === 'left';
  const cardWidth = 320;
  const cardHeight = 200;

  let x, y;

  if (cardType === 'patient') {
    // Patient cards always on the left side of the bend
    x = isLeft ? node.x - offset - cardWidth : node.x - offset - cardWidth;
    y = node.y;
  } else {
    // Clinician cards always on the right side of the bend
    x = isLeft ? node.x + offset : node.x + offset;
    y = node.y;
  }

  return {
    x: Math.max(0, x),
    y: Math.max(0, y),
    side: cardType === 'patient' ? 'left' : 'right'
  };
};

// Detect if point is near timeline path for insertion
export const isNearTimelinePath = (x, y, pathSegments, threshold = 30) => {
  for (const segment of pathSegments) {
    const distance = distanceToLineSegment(
      { x, y },
      segment.from,
      segment.to
    );
    
    if (distance <= threshold) {
      return {
        isNear: true,
        segment,
        insertionPoint: findInsertionPoint(x, y, segment)
      };
    }
  }
  
  return { isNear: false };
};

// Calculate distance from point to line segment
const distanceToLineSegment = (point, lineStart, lineEnd) => {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  
  if (lenSq === 0) return Math.sqrt(A * A + B * B);

  let param = dot / lenSq;
  param = Math.max(0, Math.min(1, param));

  const xx = lineStart.x + param * C;
  const yy = lineStart.y + param * D;

  const dx = point.x - xx;
  const dy = point.y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// Find the best insertion point on a timeline segment
const findInsertionPoint = (x, y, segment) => {
  // For horizontal segments, use the x position
  if (segment.type === 'horizontal') {
    return {
      x: Math.max(segment.from.x, Math.min(segment.to.x, x)),
      y: segment.from.y
    };
  }
  
  // For vertical segments, use the y position
  return {
    x: segment.from.x,
    y: Math.max(segment.from.y, Math.min(segment.to.y, y))
  };
};

// Animate node insertion with pop-in effect
export const createInsertionAnimation = (position) => ({
  initial: {
    opacity: 0,
    scale: 0.3,
    x: position.x,
    y: position.y,
    rotate: -10
  },
  animate: {
    opacity: 1,
    scale: 1,
    x: position.x,
    y: position.y,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 400,
      duration: 0.6
    }
  }
});

// Debounce function for performance optimization
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for high-frequency events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Validate timeline entry data
export const validateTimelineEntry = (entry) => {
  const errors = [];
  
  if (!entry.id) errors.push('Entry ID is required');
  if (!entry.timestamp) errors.push('Timestamp is required');
  if (typeof entry.orderIndex !== 'number') errors.push('Order index must be a number');
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  timelineColorScale,
  calculateZigzagPositions,
  generateTimelinePath,
  calculateCardPosition,
  isNearTimelinePath,
  createInsertionAnimation,
  debounce,
  throttle,
  validateTimelineEntry
};