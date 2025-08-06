import React, { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { TimelineNode } from './TimelineNode';
import { TimelineCard } from './TimelineCard';
import { TimelineConnections } from './TimelineConnections';

// Register GSAP plugins
gsap.registerPlugin(Draggable);

const GSAPTimeline = ({ 
  data = [], 
  onNodeClick, 
  onNodeHover, 
  width = 1200, 
  height = 800 
}) => {
  console.log('GSAPTimeline rendering with data:', data);
  
  const containerRef = useRef(null);
  const nodesRef = useRef({});
  const cardsRef = useRef({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodePositions, setNodePositions] = useState({});

  if (data.length === 0) {
    return (
      <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center" style={{ width: `${width}px`, height: `${height}px` }}>
        <p className="text-gray-500">No timeline data provided</p>
      </div>
    );
  }

  // Calculate zigzag layout positions
  const calculateZigzagLayout = (nodes, containerWidth, containerHeight) => {
    const positions = [];
    const padding = 100;
    const availableWidth = containerWidth - (padding * 2);
    const availableHeight = containerHeight - (padding * 2);
    const centerY = containerHeight / 2;
    const amplitude = 120; // How far up/down from center
    
    nodes.forEach((node, index) => {
      const progress = index / Math.max(nodes.length - 1, 1);
      const x = padding + (progress * availableWidth);
      
      // Determine side based on node data or alternate
      const isLeft = node.side === 'left' || (node.side !== 'right' && index % 2 === 0);
      const y = centerY + (isLeft ? -amplitude : amplitude);
      
      positions.push({
        x,
        y,
        side: isLeft ? 'left' : 'right'
      });
    });
    
    return positions;
  };

  // Handle node interactions
  const handleNodeMouseEnter = useCallback((nodeId) => {
    setHoveredNode(nodeId);
    onNodeHover?.(data.find(n => n.id === nodeId), true);
    
    // Animate hover effect
    const nodeElement = nodesRef.current[nodeId];
    if (nodeElement) {
      gsap.to(nodeElement, {
        scale: 1.1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [data, onNodeHover]);

  const handleNodeMouseLeave = useCallback((nodeId) => {
    setHoveredNode(null);
    onNodeHover?.(data.find(n => n.id === nodeId), false);
    
    // Reset hover effect
    const nodeElement = nodesRef.current[nodeId];
    if (nodeElement) {
      gsap.to(nodeElement, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [data, onNodeHover]);

  const handleNodeClick = useCallback((nodeId) => {
    setSelectedNode(nodeId);
    onNodeClick?.(data.find(n => n.id === nodeId));
    
    // Animate click effect
    const nodeElement = nodesRef.current[nodeId];
    if (nodeElement) {
      gsap.to(nodeElement, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });
    }
  }, [data, onNodeClick]);

  // Initialize draggable functionality
  const initializeDraggable = useCallback(() => {
    data.forEach((node) => {
      const nodeElement = nodesRef.current[node.id];
      if (nodeElement) {
        Draggable.create(nodeElement, {
          type: "x,y",
          bounds: containerRef.current,
          onDrag: function() {
            // Update positions during drag
            const currentPositions = nodePositions;
            const newPositions = { ...currentPositions };
            newPositions[node.id] = {
              x: this.x,
              y: this.y,
              side: newPositions[node.id]?.side || 'left'
            };
            setNodePositions(newPositions);
          },
          onDragEnd: function() {
            // Snap to nearest valid position or animate back
            const snapPosition = findNearestSnapPosition(this.x, this.y);
            if (snapPosition) {
              gsap.to(nodeElement, {
                x: snapPosition.x,
                y: snapPosition.y,
                duration: 0.5,
                ease: "power2.out"
              });
            }
          }
        });
      }
    });
  }, [data]); // Remove nodePositions dependency to break the loop

  // Find nearest snap position for dragged nodes
  const findNearestSnapPosition = (x, y) => {
    // Implementation for snapping to valid timeline positions
    // This can be customized based on your timeline requirements
    return null; // For now, allow free positioning
  };

  // Calculate card position relative to node
  const calculateCardPosition = useCallback((nodeId, cardType) => {
    const nodePos = nodePositions[nodeId];
    if (!nodePos) return { x: 0, y: 0 };

    const cardWidth = 320;
    const cardHeight = 160;
    const offset = 60;
    const isLeft = nodePos.side === 'left';

    let position = {};

    if (cardType === 'patient') {
      // Patient cards appear on the right side of nodes
      position = {
        x: nodePos.x + offset,
        y: nodePos.y - (cardHeight / 2)
      };
    } else {
      // Clinical cards appear on the left side of nodes
      position = {
        x: nodePos.x - cardWidth - offset,
        y: nodePos.y - (cardHeight / 2)
      };
    }

    // Ensure cards stay within bounds
    position.x = Math.max(10, Math.min(position.x, width - cardWidth - 10));
    position.y = Math.max(10, Math.min(position.y, height - cardHeight - 10));

    return position;
  }, [nodePositions, width, height]);

  // Initialize everything when component mounts or data changes
  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    console.log('GSAPTimeline useEffect running with data:', data);
    
    // Calculate zigzag positions for nodes
    const zigzagPositions = calculateZigzagLayout(data, width, height);
    
    // Update node positions state
    const positions = {};
    data.forEach((node, index) => {
      positions[node.id] = zigzagPositions[index];
    });
    setNodePositions(positions);

    // Create GSAP timeline for animations
    const tl = gsap.timeline();
    
    // Animate nodes into position
    data.forEach((node, index) => {
      const nodeElement = nodesRef.current[node.id];
      if (nodeElement) {
        // Set initial position (off-screen)
        gsap.set(nodeElement, {
          x: -200,
          y: zigzagPositions[index].y,
          opacity: 0,
          scale: 0.5
        });

        // Animate to final position
        tl.to(nodeElement, {
          x: zigzagPositions[index].x,
          y: zigzagPositions[index].y,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          delay: index * 0.2
        }, 0);
      }
    });

    // Initialize draggable after a delay
    const draggableTimer = setTimeout(() => {
      data.forEach((node) => {
        const nodeElement = nodesRef.current[node.id];
        if (nodeElement) {
          Draggable.create(nodeElement, {
            type: "x,y",
            bounds: containerRef.current,
            onDrag: function() {
              // Update positions during drag
              setNodePositions(prevPositions => {
                const newPositions = { ...prevPositions };
                newPositions[node.id] = {
                  x: this.x,
                  y: this.y,
                  side: newPositions[node.id]?.side || 'left'
                };
                return newPositions;
              });
            }
          });
        }
      });
    }, 1000);

    return () => {
      tl?.kill();
      clearTimeout(draggableTimer);
      // Clean up draggable instances
      Object.values(nodesRef.current).forEach(element => {
        if (element) {
          Draggable.get(element)?.kill();
        }
      });
    };
  }, [data, width, height]); // Only depend on data, width, height

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {/* Timeline connections/lines */}
        <TimelineConnections 
          data={data}
          positions={nodePositions}
          width={width}
          height={height}
        />

        {/* Timeline nodes */}
        {data.map((node) => (
          <TimelineNode
            key={node.id}
            ref={el => nodesRef.current[node.id] = el}
            node={node}
            position={nodePositions[node.id] || { x: 0, y: 0 }}
            isHovered={hoveredNode === node.id}
            isSelected={selectedNode === node.id}
            onMouseEnter={() => handleNodeMouseEnter(node.id)}
            onMouseLeave={() => handleNodeMouseLeave(node.id)}
            onClick={() => handleNodeClick(node.id)}
          />
        ))}

        {/* Timeline cards - only show for hovered/selected nodes */}
        {data.map((node) => {
          const shouldShowCard = hoveredNode === node.id || selectedNode === node.id;
          if (!shouldShowCard) return null;

          return (
            <React.Fragment key={`cards-${node.id}`}>
              {/* Patient card */}
              <TimelineCard
                ref={el => cardsRef.current[`${node.id}-patient`] = el}
                type="patient"
                data={node.patientInfo}
                position={calculateCardPosition(node.id, 'patient')}
                nodeId={node.id}
                title={node.title}
                date={node.date}
              />
              
              {/* Clinical card */}
              <TimelineCard
                ref={el => cardsRef.current[`${node.id}-clinical`] = el}
                type="clinical"
                data={node.clinicalInfo}
                position={calculateCardPosition(node.id, 'clinical')}
                nodeId={node.id}
                title={node.title}
                date={node.date}
              />
            </React.Fragment>
          );
        })}

        {/* Debug info - remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 bg-white p-2 rounded shadow text-xs">
            <div>Hovered: {hoveredNode || 'none'}</div>
            <div>Selected: {selectedNode || 'none'}</div>
            <div>Nodes: {data.length}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export { GSAPTimeline };
