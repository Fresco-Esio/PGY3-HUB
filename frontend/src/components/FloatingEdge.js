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
  
  // Get source and target nodes
  const sourceNode = getNode(source);
  const targetNode = getNode(target);

  // Enhanced debugging for dimension issues
  useEffect(() => {
    if (sourceNode && (!sourceNode.width && !sourceNode.dimensions)) {
      // Log comprehensive node info to understand what's available
      console.warn('Source node missing dimensions:', {
        nodeId: sourceNode.id,
        nodeType: sourceNode.type,
        position: sourceNode.position,
        positionAbsolute: sourceNode.positionAbsolute,
        width: sourceNode.width,
        height: sourceNode.height,
        data: sourceNode.data,
        dimensions: sourceNode.dimensions,
        style: sourceNode.style
      });
    }
    if (targetNode && (!targetNode.width && !targetNode.dimensions)) {
      console.warn('Target node missing dimensions:', {
        nodeId: targetNode.id,
        nodeType: targetNode.type,
        position: targetNode.position,
        positionAbsolute: targetNode.positionAbsolute,
        width: targetNode.width,
        height: targetNode.height,
        data: targetNode.data,
        dimensions: targetNode.dimensions,
        style: targetNode.style
      });
    }
  }, [sourceNode, targetNode]);

  // Memoize the edge path calculation for better performance
  const { edgePath, labelX, labelY } = useMemo(() => {
    // Default fallback if nodes aren't available
    if (!sourceNode || !targetNode) {
      return {
        edgePath: `M${sourceX},${sourceY} L${targetX},${targetY}`,
        labelX: (sourceX + targetX) / 2,
        labelY: (sourceY + targetY) / 2
      };
    }

    try {
      // Check if we have enough information to calculate an accurate path
      const hasDimensions = 
        (sourceNode.width || sourceNode.dimensions?.width) && 
        (targetNode.width || targetNode.dimensions?.width);
      
      // If we don't have dimensions, use the provided coordinates directly
      if (!hasDimensions) {
        // Use directly the coordinates provided by React Flow
        return {
          edgePath: `M${sourceX},${sourceY} L${targetX},${targetY}`,
          labelX: (sourceX + targetX) / 2,
          labelY: (sourceY + targetY) / 2
        };
      }

      // Handle node dimensions by trying multiple sources
      // Start with actual values, then try to infer from various properties
      const sourceNodeWidth = 
        sourceNode.width || 
        (sourceNode.dimensions?.width) || 
        sourceNode.data?.width || 
        sourceNode.style?.width || 
        (sourceNode.type === 'topic' ? 180 : 200);
        
      const sourceNodeHeight = 
        sourceNode.height || 
        (sourceNode.dimensions?.height) || 
        sourceNode.data?.height || 
        sourceNode.style?.height || 
        (sourceNode.type === 'topic' ? 50 : 100);
        
      const targetNodeWidth = 
        targetNode.width || 
        (targetNode.dimensions?.width) || 
        targetNode.data?.width || 
        targetNode.style?.width || 
        (targetNode.type === 'topic' ? 180 : 200);
        
      const targetNodeHeight = 
        targetNode.height || 
        (targetNode.dimensions?.height) || 
        targetNode.data?.height || 
        targetNode.style?.height || 
        (targetNode.type === 'topic' ? 50 : 100);
      
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
          sourceWidth: sourceNodeWidth,
          sourceHeight: sourceNodeHeight,
          targetWidth: targetNodeWidth,
          targetHeight: targetNodeHeight,
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
    sourceNode, 
    targetNode, 
    sourceX, 
    sourceY, 
    targetX, 
    targetY,
    // Include these to ensure edge updates when dimensions change
    sourceNode?.width,
    sourceNode?.height,
    targetNode?.width,
    targetNode?.height,
    sourceNode?.dimensions?.width,
    sourceNode?.dimensions?.height,
    targetNode?.dimensions?.width,
    targetNode?.dimensions?.height
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


