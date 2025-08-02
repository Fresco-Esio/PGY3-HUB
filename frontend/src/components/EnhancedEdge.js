import React, { memo } from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';

/**
 * Enhanced Edge Component with Label Support
 * 
 * This edge component supports labels and uses proper prop destructuring
 * to prevent React Flow-specific props from reaching DOM elements.
 */
const EnhancedEdge = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  label,
  // Destructure React Flow-specific props to prevent them from reaching DOM
  sourceHandleId,
  targetHandleId,
  data,
  selected,
  animated,
  // Don't pass any other props to BaseEdge
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        // Only pass valid BaseEdge props, no React Flow-specific props
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white px-2 py-1 rounded shadow border text-xs"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

EnhancedEdge.displayName = 'EnhancedEdge';

export default EnhancedEdge;
