import React, { memo, useMemo, useEffect } from 'react';
import { BaseEdge, useReactFlow } from '@xyflow/react';
import { getFloatingEdgePath } from '../utils/floatingEdgeUtils';

/**
 * High-Performance Floating Edge Component
 * 
 * This is an optimized edge component that calculates intersection points
 * between nodes and renders a direct straight line between them. It's 
 * specifically designed for immediate visual feedback during node dragging.
 * 
 * Features:
 * - Direct path calculation using geometry
 * - Memoized path computation for performance
 * - No transition delays or animations
 * - Minimal re-rendering
 */
const FloatingEdge = memo(({
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
  data,
  ...props
}) => {
  const { getNode } = useReactFlow();
  
  // Safely get nodes outside of useMemo to avoid scope issues
  let sourceNode, targetNode;
  try {
    sourceNode = getNode(source);
    targetNode = getNode(target);
  } catch (error) {
    // Nodes not available, will use fallback
    sourceNode = null;
    targetNode = null;
  }
  
  // Memoize the edge path calculation for better performance
  const { edgePath, labelX, labelY } = useMemo(() => {
    // During animations or rapid updates, use simple direct paths
    if (data?.__isAnimating || data?.__forceUpdate) {
      return {
        edgePath: `M${sourceX},${sourceY} L${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2
      };
    }

    // Default fallback if nodes aren't available
    if (!sourceNode || !targetNode) {
      return {
        edgePath: `M${sourceX},${sourceY} L${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2
      };
    }

    try {
      // Safely check if we have enough information to calculate an accurate path
      const sourceHasDimensions = Boolean(
        sourceNode.width || 
        sourceNode.dimensions?.width || 
        sourceNode.data?.width || 
        sourceNode.style?.width
      );
      
      const targetHasDimensions = Boolean(
        targetNode.width || 
        targetNode.dimensions?.width || 
        targetNode.data?.width || 
        targetNode.style?.width
      );
      
      // If we don't have dimensions, use the provided coordinates directly
      if (!sourceHasDimensions || !targetHasDimensions) {
        return {
          edgePath: `M${sourceX},${sourceY} L${targetX},${targetY}`,
          labelX: (sourceX + targetX) / 2,
          labelY: (sourceY + targetY) / 2
        };
      }

      // Safe dimension extraction with fallbacks
      const getNodeDimensions = (node) => {
        const defaultWidth = node.type === 'topic' ? 180 : 200;
        const defaultHeight = node.type === 'topic' ? 50 : 100;
        
        return {
          width: node.width || 
                 node.dimensions?.width || 
                 node.data?.width || 
                 defaultWidth,
          height: node.height || 
                  node.dimensions?.height || 
                  node.data?.height || 
                  defaultHeight
        };
      };
      
      const sourceDims = getNodeDimensions(sourceNode);
      const targetDims = getNodeDimensions(targetNode);

      // Calculate floating edge with proper intersections
      const floatingEdgeData = getFloatingEdgePath(
        sourceNode,
        targetNode,
        {
          // Use React Flow's sourceX/Y and targetX/Y if available
          sourcePosition: {
            x: sourceNode.positionAbsolute?.x || sourceNode.position.x,
            y: sourceNode.positionAbsolute?.y || sourceNode.position.y
          },
          targetPosition: {
            x: targetNode.positionAbsolute?.x || targetNode.position.x,
            y: targetNode.positionAbsolute?.y || targetNode.position.y
          },
          // Fallback coordinates - use the direct ones provided by React Flow
          sourceX: sourceX,
          sourceY: sourceY,
          targetX: targetX,
          targetY: targetY,
          sourceWidth: sourceDims.width,
          sourceHeight: sourceDims.height,
          targetWidth: targetDims.width,
          targetHeight: targetDims.height,
          debug: false // Set to true to debug connection issues
        }
      );

      const { 
        sourceX: sx, 
        sourceY: sy, 
        targetX: tx, 
        targetY: ty 
      } = floatingEdgeData;
      
      // Return direct line path
      return {
        edgePath: `M ${sx},${sy} L ${tx},${ty}`,
        labelX: (sx + tx) / 2,
        labelY: (sy + ty) / 2
      };
    } catch (error) {
      console.warn('FloatingEdge calculation error:', error);
      return {
        edgePath: `M${sourceX},${sourceY} L${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2
      };
    }
  }, [
    source,
    target,
    sourceX, 
    sourceY, 
    targetX, 
    targetY,
    data?.__forceUpdate,
    data?.__isAnimating,
    // Safe node dimension tracking
    sourceNode?.id,
    targetNode?.id,
    sourceNode?.width,
    sourceNode?.height,
    targetNode?.width,
    targetNode?.height
  ]);

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      labelX={labelX}
      labelY={labelY}
      style={{
        stroke: '#64748b',
        strokeWidth: 3, // Thicker line for better visibility
        strokeLinecap: 'round', // Round ends for smoother appearance
        strokeOpacity: 0.95, // Slightly more opaque
        transition: 'none', // Critical: disable all CSS transitions
        ...style
      }}
      markerEnd={markerEnd}
      markerStart={markerStart}
      {...props}
    />
  );
}, (prevProps, nextProps) => {
  // Optimize re-rendering with precise dependency checking
  return (
    prevProps.sourceX === nextProps.sourceX &&
    prevProps.sourceY === nextProps.sourceY &&
    prevProps.targetX === nextProps.targetX &&
    prevProps.targetY === nextProps.targetY &&
    prevProps.source === nextProps.source &&
    prevProps.target === nextProps.target &&
    prevProps.data?.__forceUpdate === nextProps.data?.__forceUpdate
  );
});

export default FloatingEdge;


