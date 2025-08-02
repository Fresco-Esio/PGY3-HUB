import React from 'react';

/**
 * Custom connection line component for React Flow.
 * Shows a preview of the connection as the user drags to create a new edge.
 * Styled to match our floating edge appearance but with enhanced visual feedback.
 */
const ConnectionLine = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}) => {
  // Create a straight path from source to target
  const path = `M ${fromX},${fromY} L ${toX},${toY}`;
  
  // Apply our custom styling combined with any passed styling
  const defaultStyle = {
    stroke: '#3b82f6', // Bright blue for visibility
    strokeWidth: 3.5,
    strokeLinecap: 'round',
    strokeDasharray: '5,3', 
    filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))',
    animation: 'flowingDash 1s linear infinite',
  };

  // Merge the default style with any props passed in
  const style = { ...defaultStyle, ...connectionLineStyle };

  return (
    <g>
      {/* Main visible connection line */}
      <path
        d={path}
        fill="none"
        style={style}
      />
      
      {/* Larger invisible path for easier interaction */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={15}
        style={{ pointerEvents: 'stroke' }}
      />
    </g>
  );
};

export default ConnectionLine;
