import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';

// Enhanced custom scrollbar styles with animations to match CaseModal theme
const scrollbarStyles = `
  .timeline-scrollbar::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  .timeline-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 6px;
    margin: 4px;
  }
  
  .timeline-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.6), rgba(99, 102, 241, 0.8));
    border-radius: 6px;
    border: 2px solid rgba(30, 41, 59, 0.3);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .timeline-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, rgba(59, 130, 246, 0.8), rgba(99, 102, 241, 1));
    border-color: rgba(59, 130, 246, 0.3);
    transform: scale(1.1);
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
  }
  
  .timeline-scrollbar::-webkit-scrollbar-thumb:active {
    background: linear-gradient(45deg, rgba(37, 99, 235, 0.9), rgba(79, 70, 229, 1));
    transform: scale(1.05);
  }
  
  .timeline-scrollbar::-webkit-scrollbar-corner {
    background: rgba(30, 41, 59, 0.3);
    border-radius: 6px;
  }
  
  .timeline-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.5) rgba(30, 41, 59, 0.3);
    scroll-behavior: smooth;
    animation: scrollbar-glow 3s ease-in-out infinite alternate;
  }
  
  @keyframes scrollbar-glow {
    from {
      scrollbar-color: rgba(59, 130, 246, 0.4) rgba(30, 41, 59, 0.3);
    }
    to {
      scrollbar-color: rgba(59, 130, 246, 0.7) rgba(30, 41, 59, 0.4);
    }
  }
  
  /* Smooth scrolling enhancement */
  .timeline-scrollbar {
    scroll-padding-top: 20px;
    scroll-padding-bottom: 20px;
  }

  /* Custom animations for the timeline components */
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes shimmerReverse {
    0% { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 0.2; }
  }
`;

const VerticalTimeline = ({ 
  data, 
  onNodeClick, 
  onNodeHover, 
  onDataChange,
  // Mind map integration props
  caseId,
  autoSaveMindMapData,
  setMindMapData 
}) => {
  const [nodes, setNodes] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [editingCards, setEditingCards] = useState({}); // Track which cards are being edited
  const [cardTexts, setCardTexts] = useState({}); // Store card text content
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimatingNewNode, setIsAnimatingNewNode] = useState(false); // Track new node animation
  const [isSaving, setIsSaving] = useState(false); // Track save state
  const [lastSaved, setLastSaved] = useState(null); // Track last save time
  const [scrollProgress, setScrollProgress] = useState(0); // Track scroll position
  const timelineRef = useRef(null);
  const nodeRefs = useRef({}); // Refs for direct DOM manipulation
  const pathRefs = useRef({}); // Refs for SVG path elements
  const dragState = useRef({ isDragging: false, draggedNodeId: null }); // Ref-based drag state
  const scrollContainerRef = useRef(null); // Ref for scroll container
  const saveTimeoutRef = useRef(null); // Ref for auto-save debounce
  const nodePhysics = useRef({}); // Empty placeholder for backward compatibility

  // Constants for layout
  const NODE_SPACING = 200; // Vertical spacing between nodes
  const TIMELINE_WIDTH = 800;
  const CENTER_X = TIMELINE_WIDTH / 2;
  const CARD_WIDTH = 320;
  const CARD_OFFSET = 200; // Distance from center line to card

  // Path animation properties
  const PATH_ANIMATION_DURATION = 0.3;
  const PATH_ANIMATION_EASE = "elastic.out(1, 0.4)";

  // Enhanced scroll utility functions
  const scrollToNode = useCallback((nodeId) => {
    console.log('scrollToNode called with nodeId:', nodeId);
    const node = nodes.find(n => n.id === nodeId);
    console.log('Found node:', node);
    if (node && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetY = node.y - (container.clientHeight / 2);
      console.log('Scrolling to Y position:', targetY);
      
      container.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    } else {
      console.log('Node or scroll container not found');
    }
  }, [nodes]);

  const scrollToTop = useCallback(() => {
    console.log('scrollToTop clicked');
    console.log('scrollContainerRef.current:', scrollContainerRef.current);
    if (scrollContainerRef.current) {
      console.log('Scrolling to top');
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      console.log('scrollContainerRef is null');
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    console.log('scrollToBottom clicked');
    console.log('scrollContainerRef.current:', scrollContainerRef.current);
    if (scrollContainerRef.current) {
      console.log('Scrolling to bottom, scrollHeight:', scrollContainerRef.current.scrollHeight);
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      console.log('scrollContainerRef is null');
    }
  }, []);

  // Auto-scroll to new nodes when added
  const scrollToLatestNode = useCallback(() => {
    console.log('scrollToLatestNode clicked');
    if (nodes.length > 0) {
      const latestNode = nodes[nodes.length - 1];
      console.log('Latest node:', latestNode);
      setTimeout(() => scrollToNode(latestNode.id), 100);
    } else {
      console.log('No nodes available');
    }
  }, [nodes, scrollToNode]);

  // Force scroll container to recognize new height
  const refreshScrollContainer = useCallback(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      // Force reflow by reading scroll height
      const _ = container.scrollHeight;
      // Update progress after height change
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    }
  }, []);

  // Calculate dynamic height based on actual node positions plus padding
  const totalHeight = useMemo(() => {
    if (nodes.length === 0) return 600;
    
    // Find the maximum Y position among all nodes - safe version
    const validYPositions = nodes.map(node => node.y || 0).filter(y => y > 0);
    const maxY = validYPositions.length > 0 ? Math.max(...validYPositions) : 0;
    
    // Use either the calculated height based on spacing, or actual max position + padding  
    const spacingBasedHeight = (nodes.length * 200) + 200; // 200 is NODE_SPACING value
    const positionBasedHeight = maxY + 300; // Extra padding for nodes at bottom
    
    const calculatedHeight = Math.max(600, spacingBasedHeight, positionBasedHeight);
    
    return calculatedHeight;
  }, [nodes]);

  // Refresh scroll container when totalHeight changes
  useEffect(() => {
    refreshScrollContainer();
  }, [totalHeight]); // Remove refreshScrollContainer from dependencies to prevent loop

  // Track scroll progress and ensure proper scroll container height
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const maxScroll = scrollHeight - clientHeight;
      const progress = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    // Initial progress calculation
    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [totalHeight]); // Re-run when totalHeight changes

  // Store initial positions in ref
  const initialPositions = useRef({});

  // Auto-save functionality with mind map integration - enhanced for case-specific data
  const saveTimelineData = useCallback(async (force = false) => {
    if (isSaving && !force) return;
    
    setIsSaving(true);
    
    try {
      // Prepare timeline data in the format expected by the mind map case structure
      const timelineData = nodes.map((node, index) => ({
        id: node.id || `timeline-${caseId}-${Date.now()}-${index}`,
        title: node.title || `Timeline Entry ${index + 1}`,
        type: 'timeline_entry',
        timestamp: node.date || new Date().toISOString(),
        date: node.date || new Date().toISOString(),
        orderIndex: index,
        // Patient narrative from card text or existing data
        patient_narrative: cardTexts[node.id]?.patient || node.patientData?.notes || node.patient_narrative || '',
        // Clinical notes from card text or existing data  
        clinical_notes: cardTexts[node.id]?.clinical || node.clinicalData?.notes || node.clinical_notes || '',
        // Combined content for search/display
        content: cardTexts[node.id]?.patient || cardTexts[node.id]?.clinical || node.content || '',
        // Preserve existing patient and clinical data structures
        patientData: {
          ...node.patientData,
          notes: cardTexts[node.id]?.patient || node.patientData?.notes || ''
        },
        clinicalData: {
          ...node.clinicalData,
          notes: cardTexts[node.id]?.clinical || node.clinicalData?.notes || ''
        },
        // Position and metadata
        symptoms: node.symptoms || [],
        x: node.x || CENTER_X,
        y: node.y || (100 + (index * NODE_SPACING)),
        created_at: node.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log(`Saving timeline data for case ${caseId}:`, timelineData);

      // If integrated with mind map, update the case data
      if (caseId && setMindMapData && autoSaveMindMapData) {
        setMindMapData(prevData => {
          const updatedCases = prevData.cases.map(caseItem => {
            if (String(caseItem.id) === String(caseId)) {
              return {
                ...caseItem,
                timeline: timelineData,
                last_updated: new Date().toISOString()
              };
            }
            return caseItem;
          });
          const newData = { ...prevData, cases: updatedCases };
          autoSaveMindMapData(newData);
          return newData;
        });
      } else {
        // Fallback to localStorage for standalone usage
        const standaloneData = {
          nodes: nodes.map(node => ({
            ...node,
            patientData: {
              ...node.patientData,
              notes: cardTexts[node.id]?.patient || node.patientData?.notes || ''
            },
            clinicalData: {
              ...node.clinicalData,
              notes: cardTexts[node.id]?.clinical || node.clinicalData?.notes || ''
            }
          })),
          cardTexts,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        localStorage.setItem('timeline-data', JSON.stringify(standaloneData));
      }
      
      // Call parent callback if provided
      if (onDataChange) {
        await onDataChange(timelineData);
      }
      
      setLastSaved(new Date());
      console.log('Timeline data saved successfully');
    } catch (error) {
      console.error('Failed to save timeline data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, cardTexts, isSaving, onDataChange, caseId, setMindMapData, autoSaveMindMapData]);

  // Debounced auto-save
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveTimelineData();
    }, 800); // 800ms debounce
  }, [saveTimelineData]);

  // Load timeline data from localStorage or mind map data on mount - enhanced for case-specific integration
  useEffect(() => {
    const loadTimelineData = () => {
      try {
        console.log(`Loading timeline data for case ${caseId}:`, data);
        
        // Priority 1: Load from mind map case data if integrated
        if (caseId && data && Array.isArray(data)) {
          console.log(`Loading ${data.length} timeline entries from case integration for case ${caseId}`);
          
          const timelineNodes = data.map((entry, index) => {
            const nodeId = entry.id || `timeline-${caseId}-${Date.now()}-${index}`;
            const baseY = 100 + (index * NODE_SPACING);
            
            // Initialize card texts from timeline entry data
            setCardTexts(prev => ({
              ...prev,
              [nodeId]: {
                patient: entry.patient_narrative || entry.patientData?.notes || '',
                clinical: entry.clinical_notes || entry.clinicalData?.notes || ''
              }
            }));
            
            // Store initial position in ref
            initialPositions.current[nodeId] = {
              x: entry.x || CENTER_X,
              y: entry.y || baseY,
              index: index
            };

            // No physics initialization needed for SVG path morphing
            
            return {
              id: nodeId,
              title: entry.title || `Timeline Entry ${index + 1}`,
              date: entry.timestamp || entry.date || new Date().toISOString(),
              type: entry.type || 'timeline_entry',
              patient_narrative: entry.patient_narrative || '',
              clinical_notes: entry.clinical_notes || '',
              content: entry.content || entry.patient_narrative || entry.clinical_notes || '',
              patientData: {
                notes: entry.patient_narrative || '',
                ...entry.patientData
              },
              clinicalData: {
                notes: entry.clinical_notes || '',
                ...entry.clinicalData
              },
              symptoms: entry.symptoms || [],
              x: entry.x || CENTER_X,
              y: entry.y || baseY,
              originalY: baseY,
              orderIndex: entry.orderIndex !== undefined ? entry.orderIndex : index,
              created_at: entry.created_at || new Date().toISOString(),
              updated_at: entry.updated_at || new Date().toISOString()
            };
          });
          
          if (timelineNodes.length > 0) {
            setNodes(timelineNodes);
            console.log(`Successfully loaded ${timelineNodes.length} timeline nodes for case ${caseId}`);
            return true;
          }
        }
        
        // Priority 2: Fallback to localStorage for standalone usage or case with no timeline data
        if (!caseId) {
          const savedData = localStorage.getItem('timeline-data');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            console.log('Loading saved timeline data from localStorage:', parsedData);
            
            if (parsedData.nodes && parsedData.nodes.length > 0 && nodes.length === 0) {
              setNodes(parsedData.nodes);
              if (parsedData.cardTexts) {
                setCardTexts(parsedData.cardTexts);
              }
              
              // Update refs for saved nodes
              parsedData.nodes.forEach((node, index) => {
                initialPositions.current[node.id] = {
                  x: node.x || CENTER_X,
                  y: node.y || (100 + (index * NODE_SPACING)),
                  index: index
                };
                
                // No physics initialization needed for SVG path morphing
              });
              
              setLastSaved(new Date(parsedData.timestamp));
              return true;
            }
          }
        }
        
        // If no data found, initialize empty timeline for new cases
        console.log(`No existing timeline data found for case ${caseId || 'standalone'}, initializing empty timeline`);
        return false;
        
      } catch (error) {
        console.error('Failed to load timeline data:', error);
        return false;
      }
    };

    // Try to load saved data first, then fall back to prop data
    const dataLoaded = loadTimelineData();
    if (!dataLoaded && data && data.length > 0 && nodes.length === 0 && !caseId) {
      // Initialize with prop data if no saved data and not integrated with mind map
      const initialNodes = data.map((item, index) => {
        const baseY = 100 + (index * NODE_SPACING);
        const nodeId = item.id;
        
        // Store initial position in ref
        initialPositions.current[nodeId] = {
          x: CENTER_X,
          y: baseY,
          index: index
        };

        // No physics initialization needed for SVG path morphing
        
        // Initialize card texts from data
        setCardTexts(prev => ({
          ...prev,
          [nodeId]: {
            patient: item.patientData?.notes || item.patientData?.chiefComplaint || '',
            clinical: item.clinicalData?.notes || item.clinicalData?.chiefComplaint || ''
          }
        }));
        
        return {
          ...item,
          x: CENTER_X,
          y: baseY,
          originalY: baseY
        };
      });
      setNodes(initialNodes);
    }
  }, [data, caseId]); // Include caseId in dependencies

  // Update SVG path connections between nodes
  const updateConnectionPaths = useCallback((draggedNodeId, draggedPosition) => {
    // Find the dragged node's index
    const draggedIndex = initialPositions.current[draggedNodeId]?.index;
    if (draggedIndex === undefined) return;
    
    // Find connections that need updating (previous and next connections)
    const connectionsToUpdate = [];
    
    // If not the first node, update connection from previous node
    if (draggedIndex > 0) {
      const prevNode = nodes[draggedIndex - 1];
      if (prevNode) {
        connectionsToUpdate.push({
          id: `connection-${draggedNodeId}-prev`,
          sourceNode: prevNode,
          targetNode: { ...prevNode, x: draggedPosition.x, y: draggedPosition.y }
        });
      }
    }
    
    // If not the last node, update connection to next node
    if (draggedIndex < nodes.length - 1) {
      const nextNode = nodes[draggedIndex + 1];
      if (nextNode) {
        connectionsToUpdate.push({
          id: `connection-${draggedNodeId}-next`,
          sourceNode: { ...nextNode, x: draggedPosition.x, y: draggedPosition.y },
          targetNode: nextNode
        });
      }
    }
    
    // Update each connection path with GSAP animation
    connectionsToUpdate.forEach(connection => {
      const pathRef = pathRefs.current[connection.id];
      
      if (pathRef) {
        // Calculate curved Bezier path
        const x1 = connection.sourceNode.x;
        const y1 = connection.sourceNode.y;
        const x2 = connection.targetNode.x;
        const y2 = connection.targetNode.y;
        
        // Create a curved path using cubic Bezier that bows slightly outward
        const pathD = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
        
        // Animate the path morphing with GSAP
        gsap.to(pathRef, {
          attr: { d: pathD },
          duration: PATH_ANIMATION_DURATION,
          ease: PATH_ANIMATION_EASE
        });
      }
    });
  }, [nodes]);

  // Native drag handling for instant response
  const handleMouseDown = useCallback((event, nodeId) => {
    event.preventDefault();
    
    dragState.current.isDragging = true;
    dragState.current.draggedNodeId = nodeId;
    setIsDragging(true);

    const currentNodeRef = nodeRefs.current[nodeId];
    if (!currentNodeRef) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const initialPos = initialPositions.current[nodeId];
    if (!initialPos) return;

    // Calculate initial offset between mouse and node center
    const startMouseX = event.clientX;
    const startMouseY = event.clientY;
    const startNodeX = initialPos.x;
    const startNodeY = initialPos.y;

    const handleMouseMove = (moveEvent) => {
      // Calculate exact mouse position relative to timeline container
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = moveEvent.clientX - rect.left;
      const mouseY = moveEvent.clientY - rect.top;

      // Apply constraints - allow Y to expand beyond current totalHeight
      const constrainedX = Math.max(50, Math.min(TIMELINE_WIDTH - 50, mouseX));
      // Remove rigid Y constraint to allow expansion, but keep minimum boundary
      const constrainedY = Math.max(50, mouseY);

      // Position node directly at mouse position (accounting for node center offset)
      currentNodeRef.style.left = `${constrainedX - 30}px`; // Updated for bigger nodes (60x60)
      currentNodeRef.style.top = `${constrainedY - 30}px`; // Updated for bigger nodes (60x60)
      currentNodeRef.style.transform = '';

      // Update node state immediately for cards to follow
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === nodeId 
            ? { ...node, x: constrainedX, y: constrainedY }
            : node
        )
      );

      // Update connection paths with GSAP animations
      updateConnectionPaths(nodeId, { x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = (upEvent) => {
      dragState.current.isDragging = false;
      dragState.current.draggedNodeId = null;
      setIsDragging(false);

      // Add a small wobble effect on path when drag ends
      const connectionIds = [
        `connection-${nodeId}-prev`,
        `connection-${nodeId}-next`
      ];
      
      // Apply wobble animation to affected paths
      connectionIds.forEach(id => {
        const pathRef = pathRefs.current[id];
        if (pathRef) {
          gsap.fromTo(pathRef,
            { rotation: -1 },
            { rotation: 0, duration: 0.3, ease: "sine.out" }
          );
        }
      });

      // Calculate final position from current DOM position
      const rect = timelineRef.current?.getBoundingClientRect();
      if (!rect) return;

      const finalX = Math.max(50, Math.min(TIMELINE_WIDTH - 50, upEvent.clientX - rect.left));
      // Remove rigid Y constraint to allow expansion beyond current totalHeight
      const finalY = Math.max(50, upEvent.clientY - rect.top);

      // Update state
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === nodeId 
            ? { ...node, x: finalX, y: finalY }
            : node
        )
      );

      // Update the initial position reference for future drags
      initialPositions.current[nodeId].x = finalX;
      initialPositions.current[nodeId].y = finalY;

      // Trigger auto-save after position change
      triggerAutoSave();

      // Refresh scroll container to recognize new height
      setTimeout(() => refreshScrollContainer(), 50);

      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      // Small delay to allow drag state to clear before click events
      setTimeout(() => {
        dragState.current.isDragging = false;
      }, 10);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [totalHeight, updateConnectionPaths, triggerAutoSave]); // Remove refreshScrollContainer to prevent dependency loop

  // Handle node click - trigger edit mode for both cards and scroll to center
  const handleNodeClick = useCallback((node) => {
    // Only trigger if not currently dragging
    if (dragState.current.isDragging) return;
    
    // Smooth scroll to center the clicked node
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const targetY = node.y - (container.clientHeight / 2);
      
      container.scrollTo({
        top: Math.max(0, targetY),
        behavior: 'smooth'
      });
    }
    
    // Clear any hover state and set editing state for this node only
    setHoveredNode(null);
    setEditingCards({
      [node.id]: { patient: true, clinical: true }
    });
    onNodeClick?.(node);
  }, [onNodeClick]);

  // Handle node hover
  const handleNodeHover = useCallback((node, isHovering) => {
    if (!dragState.current.isDragging) {
      if (isHovering) {
        // Clear any existing editing states when hovering over a different node
        setEditingCards({});
        setHoveredNode(node);
      } else {
        setHoveredNode(null);
      }
      onNodeHover?.(node, isHovering);
    }
  }, [onNodeHover]);

  // Handle text change with auto-save
  const handleTextChange = useCallback((nodeId, cardType, newText) => {
    setCardTexts(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [cardType]: newText
      }
    }));
    
    // Trigger auto-save after text change
    triggerAutoSave();
  }, [triggerAutoSave]);

  // Handle click outside card (save and exit edit mode for both cards)
  const handleClickOutside = useCallback((nodeId, cardType) => {
    setEditingCards(prev => ({
      ...prev,
      [nodeId]: { patient: false, clinical: false }
    }));
  }, []);

  // Determine if cards should be visible
  const shouldShowCards = useCallback((nodeId) => {
    const isHovered = hoveredNode?.id === nodeId;
    const isEditing = editingCards[nodeId]?.patient || editingCards[nodeId]?.clinical;
    console.log(`Cards visibility check for ${nodeId}:`, { isHovered, isEditing, editingState: editingCards[nodeId] });
    return isHovered || isEditing;
  }, [hoveredNode, editingCards]);

  // Handle adding new node to the timeline
  const handleAddNode = useCallback(() => {
    if (isAnimatingNewNode) return; // Prevent multiple additions during animation
    
    setIsAnimatingNewNode(true);
    
    // Generate new node data
    const newNodeId = `node-${Date.now()}`;
    const newIndex = nodes.length;
    const baseY = 100 + (newIndex * NODE_SPACING);
    
    const newNodeData = {
      id: newNodeId,
      date: new Date().toISOString(),
      patientData: {
        chiefComplaint: '',
        notes: ''
      },
      clinicalData: {
        chiefComplaint: '',
        notes: ''
      },
      x: CENTER_X,
      y: baseY,
      originalY: baseY
    };

    // Store initial position and physics data
    initialPositions.current[newNodeId] = {
      x: CENTER_X,
      y: baseY,
      index: newIndex
    };

    // No physics initialization needed for SVG path morphing

    // Initialize card texts
    setCardTexts(prev => ({
      ...prev,
      [newNodeId]: {
        patient: '',
        clinical: ''
      }
    }));

    // Add new node to the timeline
    setNodes(prevNodes => {
      const updatedNodes = [...prevNodes, newNodeData];
      
      // Update all node indices in initialPositions
      updatedNodes.forEach((node, index) => {
        if (initialPositions.current[node.id]) {
          initialPositions.current[node.id].index = index;
        }
      });
      
      return updatedNodes;
    });

    // Scroll to the new node after a brief delay for animation
    setTimeout(() => {
      const newNodeElement = document.querySelector(`[data-node-id="${newNodeId}"]`);
      if (newNodeElement && scrollContainerRef.current) {
        newNodeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest' 
        });
      }
      setIsAnimatingNewNode(false);
      
      // Trigger auto-save after adding new node
      triggerAutoSave();
    }, 800);

  }, [nodes.length, isAnimatingNewNode, triggerAutoSave]);

  // Handle resetting layout to original straight line
  const handleResetLayout = useCallback(() => {
    // Reset all nodes to their original positions
    setNodes(prevNodes => 
      prevNodes.map((node, index) => {
        const baseY = 100 + (index * NODE_SPACING);
        const resetNode = {
          ...node,
          x: CENTER_X,
          y: baseY,
          originalY: baseY
        };

        // Update initial positions reference
        if (initialPositions.current[node.id]) {
          initialPositions.current[node.id].x = CENTER_X;
          initialPositions.current[node.id].y = baseY;
          initialPositions.current[node.id].index = index;
        }

        // Reset physics state
        // Update connection paths after layout reset
        const prevId = `connection-${node.id}-prev`;
        const nextId = `connection-${node.id}-next`;
        
        [prevId, nextId].forEach(id => {
          const pathRef = pathRefs.current[id];
          if (pathRef) {
            gsap.to(pathRef, {
              attr: { d: "" }, // Will be recalculated when nodes are rendered
              duration: PATH_ANIMATION_DURATION,
              ease: PATH_ANIMATION_EASE
            });
          }
        });

        // Update DOM positions immediately
        const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeElement) {
          nodeElement.style.left = `${CENTER_X - 30}px`;
          nodeElement.style.top = `${baseY - 30}px`;
          nodeElement.style.transform = '';
        }

        // Update card positions
        const patientCard = document.querySelector(`[data-patient-card="${node.id}"]`);
        const clinicalCard = document.querySelector(`[data-clinical-card="${node.id}"]`);
        if (patientCard) {
          patientCard.style.left = `${CENTER_X - CARD_OFFSET - CARD_WIDTH}px`;
          patientCard.style.top = `${baseY - 60}px`;
          patientCard.style.transform = '';
        }
        if (clinicalCard) {
          clinicalCard.style.left = `${CENTER_X + CARD_OFFSET}px`;
          clinicalCard.style.top = `${baseY - 60}px`;
          clinicalCard.style.transform = '';
        }

        return resetNode;
      })
    );
    
    // Trigger auto-save after reset
    triggerAutoSave();
  }, [triggerAutoSave]);

  // Manual save function
  const handleManualSave = useCallback(() => {
    saveTimelineData(true); // Force save
  }, [saveTimelineData]);

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Inject custom scrollbar styles */}
      <style>{scrollbarStyles}</style>
      
      {/* Control Buttons Container */}
      <div className="absolute top-4 right-4 flex gap-2 z-40">
        {/* Scroll Navigation */}
        <motion.button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:shadow-blue-300/30"
          onClick={scrollToTop}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.8, duration: 0.5 }}
          title="Scroll to Top"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Top
        </motion.button>

        <motion.button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:shadow-blue-300/30"
          onClick={scrollToBottom}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.0, duration: 0.5 }}
          title="Scroll to Bottom"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V4" />
          </svg>
          Bottom
        </motion.button>

        <motion.button
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:shadow-indigo-300/30"
          onClick={scrollToLatestNode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          title="Go to Latest Entry"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Latest
        </motion.button>

        {/* Save Button */}
        <motion.button
          className={`${
            isSaving 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-300/30'
          } text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all`}
          onClick={handleManualSave}
          disabled={isSaving}
          whileHover={!isSaving ? { scale: 1.05 } : {}}
          whileTap={!isSaving ? { scale: 0.95 } : {}}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
        >
          {isSaving ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          )}
          {isSaving ? 'Saving...' : 'Save'}
        </motion.button>

        {/* Reset Layout Button */}
        <motion.button
          className="bg-gradient-to-r from-gray-600 to-slate-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:shadow-gray-400/20"
          onClick={handleResetLayout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Layout
        </motion.button>

        {/* Add Node Button */}
        <motion.button
          className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-all hover:shadow-blue-400/30"
          onClick={handleAddNode}
          disabled={isAnimatingNewNode}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {isAnimatingNewNode ? 'Adding...' : 'Add Node'}
        </motion.button>
      </div>

      {/* Scrollable Timeline Container */}
      <div 
        ref={scrollContainerRef}
        className="timeline-scrollbar relative w-full overflow-y-auto"
        style={{ 
          height: '80vh', // Fixed height to ensure scrolling works
          maxHeight: '600px' // Maximum height constraint
        }}
        onClick={(e) => {
          // Close all edit modes when clicking outside cards and nodes
          const isClickOnCard = e.target.closest('.timeline-card');
          const isClickOnNode = e.target.closest('.timeline-node');
          const isClickOnButton = e.target.closest('button');
          
          if (!isClickOnCard && !isClickOnNode && !isClickOnButton) {
            setEditingCards({});
          }
        }}
      >
        <div 
          className="relative w-full" 
          style={{ 
            height: Math.max((totalHeight || 600) + 200, window.innerHeight || 600),
            minHeight: '100vh' // Ensure minimum height is always at least viewport height
          }}
        >
      {/* Main timeline container */}
      <div 
        ref={timelineRef}
        className="relative mx-auto"
        style={{ width: TIMELINE_WIDTH, height: (totalHeight || 600) + 200 }}
      >
        {/* Dynamic vertical line that responds to node movement */}
        <svg 
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
          width={TIMELINE_WIDTH}
          height={totalHeight + 200}
          viewBox={`0 0 ${TIMELINE_WIDTH} ${totalHeight + 200}`}
        >
          <path
            d={`M ${CENTER_X} 50 ${nodes.map(node => `L ${node.x} ${node.y}`).join(' ')}`}
            stroke="url(#timelineGradient)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="5,5"
          />
          
          {/* Define gradients for timeline elements */}
          <defs>
            <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#C4B5FD" />
            </linearGradient>
            <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Curved connection paths between nodes with GSAP morphing */}
          {nodes.map((node, index) => {
            if (index === 0) return null;
            const prevNode = nodes[index - 1];
            
            // Create curved Bezier path
            const x1 = prevNode.x;
            const y1 = prevNode.y;
            const x2 = node.x;
            const y2 = node.y;
            const pathD = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;
            
            // Create connection IDs for both directions
            const prevConnectionId = `connection-${prevNode.id}-next`;
            const nextConnectionId = `connection-${node.id}-prev`;
            
            // Generate the key using both node IDs to ensure uniqueness
            const connectionKey = `connection-${prevNode.id}-${node.id}`;
            
            return (
              <motion.path
                key={connectionKey}
                ref={el => {
                  // Store refs for both connecting nodes for animation
                  pathRefs.current[prevConnectionId] = el;
                  pathRefs.current[nextConnectionId] = el;
                }}
                d={pathD}
                stroke="url(#connectionGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeOpacity="0.8"
                filter="url(#glow)"
                style={{ transformOrigin: 'center' }}
                initial={{ opacity: 1, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 0.8, delay: Math.min(0.5, index * 0.1) }}
              />
            );
          })}
        </svg>

        {/* Timeline title */}
        <motion.div
          className="absolute text-center"
          style={{
            left: CENTER_X - 150,
            top: 10,
            width: 300
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Patient Timeline</h2>
          <p className="text-sm text-gray-600">Instant 1:1 drag • Hover for cards • Click to edit</p>
        </motion.div>

        {/* All connections are now handled by the SVG path elements above */}

        {/* Timeline nodes */}
        {nodes.map((node, index) => (
          <div key={node.id}>
            {/* Pure DOM Draggable Timeline Node */}
            <motion.div
              ref={el => nodeRefs.current[node.id] = el}
              data-node-id={node.id}
              className={`timeline-node absolute cursor-grab active:cursor-grabbing transform-gpu ${
                hoveredNode?.id === node.id
                  ? 'ring-[5px] ring-purple-200/40 shadow-xl scale-110' 
                  : 'shadow-md hover:shadow-lg hover:scale-105'
              }`}
              style={{
                left: node.x - 30, // Updated for bigger nodes
                top: node.y - 30, // Updated for bigger nodes
                width: 60, // Increased from 40
                height: 60, // Increased from 40
                borderRadius: '50%',
                background: hoveredNode?.id === node.id
                  ? 'linear-gradient(135deg, #8B5CF6, #6366F1, #4F46E5)' // Purple to indigo gradient when hovered
                  : 'linear-gradient(135deg, #3B82F6, #6366F1, #4F46E5)', // Blue to indigo gradient normally
                boxShadow: hoveredNode?.id === node.id
                  ? '0 0 20px rgba(139, 92, 246, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.2)' // Enhanced purple glow when hovered
                  : '0 0 15px rgba(59, 130, 246, 0.5), inset 0 0 8px rgba(255, 255, 255, 0.2)', // Enhanced blue glow normally
                border: '3px solid rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: dragState.current.isDragging 
                  ? 'none' 
                  : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease-out',
                willChange: dragState.current.isDragging ? 'transform' : 'auto'
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 20,
                delay: index * 0.1 
              }}
              onMouseDown={(event) => {
                // Add active state animation
                const nodeEl = event.currentTarget;
                nodeEl.style.transform = 'scale(0.95)';
                setTimeout(() => {
                  if (nodeEl.style.transform === 'scale(0.95)') {
                    nodeEl.style.transform = '';
                  }
                }, 100);
                
                handleMouseDown(event, node.id);
              }}
              onClick={(event) => {
                event.stopPropagation();
                // Small delay to ensure drag state is cleared
                setTimeout(() => {
                  if (!dragState.current.isDragging) {
                    handleNodeClick(node);
                  }
                }, 20);
              }}
              onMouseEnter={(event) => {
                // Only trigger hover if not dragging
                if (!dragState.current.isDragging) {
                  handleNodeHover(node, true);
                }
              }}
              onMouseLeave={(event) => {
                // Only trigger hover if not dragging
                if (!dragState.current.isDragging) {
                  handleNodeHover(node, false);
                }
              }}
            >
              {/* Node inner circle with pulse animation and icon */}
              <div className="w-full h-full rounded-full bg-gradient-to-b from-white/40 to-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-[1px]">
                {/* Glass effect background */}
                <div className="absolute inset-1 rounded-full bg-white/10 backdrop-blur-[2px]"></div>
                
                {/* Icon with enhanced styling */}
                <div className="z-10 text-white drop-shadow-lg relative">
                  {/* Show different icons based on node content or type */}
                  {node.symptoms && node.symptoms.length > 0 ? (
                    <svg className="w-6 h-6 filter drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" clipRule="evenodd" />
                    </svg>
                  ) : node.patientData?.notes ? (
                    <svg className="w-6 h-6 filter drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 filter drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                {/* Enhanced pulse ring effect with gradient */}
                <div 
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-white/30 to-blue-300/30"
                  style={{
                    animation: hoveredNode?.id === node.id 
                      ? 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
                      : 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    opacity: hoveredNode?.id === node.id ? 0.8 : 0.4
                  }}
                ></div>
                
                {/* Second pulse ring for enhanced effect */}
                {hoveredNode?.id === node.id && (
                  <div 
                    className="absolute inset-[-5px] rounded-full bg-purple-300/20"
                    style={{
                      animation: 'pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite 0.5s'
                    }}
                  ></div>
                )}
              </div>
              
              {/* Date label with slide animation */}
              <div 
                className={`absolute text-xs font-medium whitespace-nowrap transition-all duration-200 ease-out ${
                  hoveredNode?.id === node.id 
                  ? 'translate-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' 
                  : 'bg-white/90 text-gray-700'
                } px-2 py-1 rounded-md shadow-sm`}
                style={{
                  left: 70, // Adjusted for bigger node
                  top: '50%',
                  transform: hoveredNode?.id === node.id 
                    ? 'translateY(-50%) translateX(8px) scale(1.05)' 
                    : 'translateY(-50%)',
                  borderLeft: hoveredNode?.id === node.id
                    ? '3px solid rgba(255, 255, 255, 0.7)'
                    : 'none'
                }}
              >
                {/* Format date to be more readable */}
                {(() => {
                  const date = new Date(node.date);
                  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
                })()}
              </div>
            </motion.div>

            {/* Hover/Edit Cards */}
            <AnimatePresence>
              {shouldShowCards(node.id) && (
                <>
                  {/* Patient Card */}
                  <motion.div
                    data-patient-card={node.id}
                    className="timeline-card absolute bg-white rounded-lg shadow-xl z-20 backdrop-blur-sm"
                    style={{
                      left: node.x - CARD_OFFSET - CARD_WIDTH,
                      top: node.y - 60,
                      width: CARD_WIDTH,
                      borderRadius: '0.75rem',
                      borderLeft: '4px solid transparent',
                      borderImage: 'linear-gradient(to bottom, #3B82F6, #8B5CF6) 1',
                      boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.3), 0 8px 10px -6px rgba(67, 56, 202, 0.25)',
                      padding: '16px',
                      background: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))',
                    }}
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mr-2 shadow-sm"></div>
                      <h4 className="font-semibold bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">Patient Narrative</h4>
                      {editingCards[node.id]?.patient && (
                        <div className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-200 shadow-inner border border-blue-700/30">Editing</div>
                      )}
                    </div>
                    
                    {editingCards[node.id]?.patient ? (
                      <textarea
                        className="w-full h-24 p-3 border-2 border-blue-700/50 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 shadow-inner bg-slate-800/70 backdrop-blur-sm transition-all text-blue-100"
                        value={cardTexts[node.id]?.patient || ''}
                        onChange={(e) => handleTextChange(node.id, 'patient', e.target.value)}
                        onBlur={(e) => {
                          // Save and close when focus is lost
                          handleClickOutside(node.id, 'patient');
                        }}
                        placeholder="Enter patient narrative..."
                        style={{
                          boxShadow: 'inset 0 2px 4px 0 rgba(29, 78, 216, 0.2)'
                        }}
                      />
                    ) : (
                      <div
                        className="text-sm text-blue-100 min-h-[60px] p-3 border-2 border-transparent hover:border-blue-700/40 rounded-lg cursor-text hover:bg-slate-800/50 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clear any hover state and set editing for this node only
                          setHoveredNode(null);
                          setEditingCards({
                            [node.id]: { patient: true, clinical: true }
                          });
                        }}
                        style={{
                          backgroundImage: cardTexts[node.id]?.patient ? 'linear-gradient(to bottom right, rgba(30, 58, 138, 0.3), rgba(30, 64, 175, 0.15))' : 'none',
                          boxShadow: cardTexts[node.id]?.patient ? 'inset 0 1px 2px 0 rgba(29, 78, 216, 0.15)' : 'none'
                        }}
                      >
                        {cardTexts[node.id]?.patient || (
                          <span className="text-blue-300 italic">Click to add patient narrative...</span>
                        )}
                      </div>
                    )}
                    
                    {/* Connection line to node - gradient line with animated pulse */}
                    <div className="absolute" style={{
                        width: CARD_OFFSET - 20,
                        height: 2,
                        right: -CARD_OFFSET + 20,
                        top: 50,
                        zIndex: 0,
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        className="h-full w-full bg-gradient-to-r from-blue-300 via-indigo-400 to-blue-500"
                        style={{
                          animation: hoveredNode?.id === node.id 
                            ? 'shimmer 1.5s linear infinite' 
                            : 'none'
                        }}
                      ></div>
                      <style jsx>{`
                        @keyframes shimmer {
                          0% { transform: translateX(-100%); }
                          100% { transform: translateX(100%); }
                        }
                      `}</style>
                    </div>
                  </motion.div>

                  {/* Clinical Card */}
                  <motion.div
                    data-clinical-card={node.id}
                    className="timeline-card absolute bg-white rounded-lg shadow-xl z-20 backdrop-blur-sm"
                    style={{
                      left: node.x + CARD_OFFSET,
                      top: node.y - 60,
                      width: CARD_WIDTH,
                      borderRadius: '0.75rem',
                      borderLeft: '4px solid transparent',
                      borderImage: 'linear-gradient(to bottom, #8B5CF6, #6366F1) 1',
                      boxShadow: '0 10px 25px -5px rgba(91, 33, 182, 0.3), 0 8px 10px -6px rgba(76, 29, 149, 0.25)',
                      padding: '16px',
                      background: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.9))'
                    }}
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full mr-2 shadow-sm"></div>
                      <h4 className="font-semibold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">Clinical Impression</h4>
                      {editingCards[node.id]?.clinical && (
                        <div className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-200 shadow-inner border border-purple-700/30">Editing</div>
                      )}
                    </div>
                    
                    {editingCards[node.id]?.clinical ? (
                      <textarea
                        className="w-full h-24 p-3 border-2 border-purple-700/50 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-600 shadow-inner bg-slate-800/70 backdrop-blur-sm transition-all text-purple-100"
                        value={cardTexts[node.id]?.clinical || ''}
                        onChange={(e) => handleTextChange(node.id, 'clinical', e.target.value)}
                        onBlur={(e) => {
                          // Save and close when focus is lost
                          handleClickOutside(node.id, 'clinical');
                        }}
                        placeholder="Enter clinical impression..."
                        style={{
                          boxShadow: 'inset 0 2px 4px 0 rgba(126, 34, 206, 0.2)'
                        }}
                      />
                    ) : (
                      <div
                        className="text-sm text-purple-100 min-h-[60px] p-3 border-2 border-transparent hover:border-purple-700/40 rounded-lg cursor-text hover:bg-slate-800/50 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clear any hover state and set editing for this node only
                          setHoveredNode(null);
                          setEditingCards({
                            [node.id]: { patient: true, clinical: true }
                          });
                        }}
                        style={{
                          backgroundImage: cardTexts[node.id]?.clinical ? 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.3), rgba(76, 29, 149, 0.15))' : 'none',
                          boxShadow: cardTexts[node.id]?.clinical ? 'inset 0 1px 2px 0 rgba(126, 34, 206, 0.15)' : 'none'
                        }}
                      >
                        {cardTexts[node.id]?.clinical || (
                          <span className="text-purple-300 italic">Click to add clinical impression...</span>
                        )}
                      </div>
                    )}
                    
                    {/* Connection line to node - gradient line with animated pulse */}
                    <div className="absolute" style={{
                        width: CARD_OFFSET - 20,
                        height: 2,
                        left: -CARD_OFFSET + 20,
                        top: 50,
                        zIndex: 0,
                        overflow: 'hidden'
                      }}
                    >
                      <div 
                        className="h-full w-full bg-gradient-to-r from-purple-300 via-indigo-400 to-purple-500"
                        style={{
                          animation: hoveredNode?.id === node.id 
                            ? 'shimmerReverse 1.5s linear infinite' 
                            : 'none'
                        }}
                      ></div>
                      <style jsx>{`
                        @keyframes shimmerReverse {
                          0% { transform: translateX(100%); }
                          100% { transform: translateX(-100%); }
                        }
                      `}</style>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ))}
      
        {/* Scroll Progress Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40">
          <motion.div 
            className="bg-slate-800 bg-opacity-90 rounded-full px-4 py-2 flex items-center gap-3 shadow-lg border border-slate-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
          >
            <span className="text-sm text-blue-300">
              {nodes.length} {nodes.length === 1 ? 'entry' : 'entries'}
            </span>
            <div className="w-px h-4 bg-slate-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 bg-slate-600 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${scrollProgress}%` }}
                ></div>
              </div>
              <span className="text-xs text-slate-400 min-w-[3rem] text-center">
                {scrollProgress}%
              </span>
            </div>
            <div className="w-px h-4 bg-slate-600"></div>
            <span className="text-xs text-slate-400">
              Click nodes to center
            </span>
          </motion.div>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default VerticalTimeline;
