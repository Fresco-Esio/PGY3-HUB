import React, { memo, useMemo, useEffect } from 'react';
import { BaseEdge, useReactFlow } from '@xyflow/react';
import { getFloatingEdgePath } from '../utils/floatingEdgeUtils';

/**
 * 🎨 ENHANCED ARTISTIC FLOATING EDGE COMPONENT
 * 
 * This redesigned edge component provides:
 * - Type-based styling (topic-to-case = dashed, task-to-case = solid)
 * - Gradient strokes for enhanced visual appeal
 * - Cubic Bézier curves for smooth connections
 * - Hoverable labels with dark translucent backgrounds
 * - Performance-optimized path calculations
 * 
 * Features:
 * - Direct path calculation using geometry
 * - Memoized path computation for performance
 * - Type-specific styling based on source/target node types
 * - Smooth gradients and enhanced visual effects
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
  label,
  labelStyle = {},
  labelShowBg = true,
  labelBgStyle = {},
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

  // 🎨 ARTISTIC EDGE STYLING based on node types
  const getEdgeStyles = useMemo(() => {
    const sourceType = sourceNode?.type || 'default';
    const targetType = targetNode?.type || 'default';
    const edgeKey = `${sourceType}-${targetType}`;

    // Debug logging to check node type detection
    console.log('FloatingEdge styling:', { sourceType, targetType, edgeKey, sourceNodeId: source, targetNodeId: target });

    // Enhanced styling based on connection types
    switch (edgeKey) {
      case 'topic-case':
      case 'case-topic':
        return {
          stroke: 'url(#topicCaseGradient)',
          strokeWidth: 3,
          strokeDasharray: '8,4',
          filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))',
          animation: 'dash-flow 2s linear infinite'
        };
      
      case 'task-case':
      case 'case-task':
        return {
          stroke: 'url(#taskCaseGradient)',
          strokeWidth: 4,
          strokeDasharray: '6,3',              // Add dashed pattern
          animation: 'dash-flow 3s linear infinite', // Add flowing animation
          filter: 'drop-shadow(0 2px 4px rgba(248, 113, 113, 0.4))',  // Slightly stronger shadow
          strokeLinecap: 'round'               // Rounded dash ends for smoother look
        };
      
      case 'literature-case':
      case 'case-literature':
        return {
          stroke: 'url(#literatureCaseGradient)',
          strokeWidth: 2,
          strokeDasharray: '4,2,1,2',
          filter: 'drop-shadow(0 1px 3px rgba(217, 119, 6, 0.2))'
        };
      
      case 'topic-task':
      case 'task-topic':
        return {
          stroke: 'url(#topicTaskGradient)',
          strokeWidth: 2.5,
          strokeDasharray: '6,3',
          filter: 'drop-shadow(0 2px 4px rgba(99, 102, 241, 0.25))'
        };
      
      default:
        console.log('Using default edge styling for:', edgeKey);
        return {
          stroke: 'url(#defaultGradient)',
          strokeWidth: 2,
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))'
        };
    }
  }, [sourceNode?.type, targetNode?.type, source, target]);

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
      
      // 🎨 Enhanced cubic Bézier curve for smooth connections
      const deltaX = tx - sx;
      const deltaY = ty - sy;
      const controlDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * 0.25;
      
      // Calculate control points for smooth curves
      const controlX1 = sx + (deltaX > 0 ? controlDistance : -controlDistance);
      const controlY1 = sy;
      const controlX2 = tx - (deltaX > 0 ? controlDistance : -controlDistance);  
      const controlY2 = ty;
      
      return {
        edgePath: `M ${sx},${sy} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${tx},${ty}`,
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
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        labelX={labelX}
        labelY={labelY}
        style={{
          transition: 'none', // Critical: disable all CSS transitions for performance
          ...getEdgeStyles, // Apply artistic styling
          ...style // Allow override
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
      />
      
      {/* 🏷️ ENHANCED EDGE LABEL with dark translucent background */}
      {label && (
        <foreignObject
          x={labelX - 50}
          y={labelY - 12}
          width={100}
          height={24}
          className="overflow-visible"
        >
          <div
            className={`
              flex items-center justify-center px-3 py-1 rounded-lg
              text-xs font-medium text-white backdrop-blur-sm
              transition-opacity duration-200 opacity-0 hover:opacity-100
              pointer-events-none
            `}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              ...labelBgStyle
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
    </>
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


