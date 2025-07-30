// Canvas-based D3 Timeline with Hover-only Cards
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Save,
  Loader2,
  User,
  Brain,
  Pin
} from 'lucide-react';
import { select } from 'd3-selection';
import { drag } from 'd3-drag';
import { forceSimulation, forceManyBody, forceCenter, forceCollide, forceLink } from 'd3-force';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

// Minimal animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } }
};

const AngularTimeline = React.memo(({ 
  timeline = [], 
  onUpdateTimeline, 
  isLoading = false,
  addToast 
}) => {
  const [entries, setEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [hoveredEntryId, setHoveredEntryId] = useState(null);
  const [hoveredNodePosition, setHoveredNodePosition] = useState(null);
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const timelineContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Layout constants - optimized for canvas
  const TIMELINE_WIDTH = 600;
  const TIMELINE_HEIGHT = 350;
  const DYNAMIC_HEIGHT_FACTOR = 80;
  const NODE_RADIUS = 8;
  const CARD_OFFSET = 40;
  const DPI = window.devicePixelRatio || 1;

  // Color scale for nodes
  const colorScale = scaleOrdinal(schemeCategory10);

  // Calculate dynamic timeline height
  const dynamicTimelineHeight = useMemo(() => {
    return Math.max(TIMELINE_HEIGHT, entries.length * DYNAMIC_HEIGHT_FACTOR + 200);
  }, [entries.length]);

  // Process entries
  const processedEntries = useMemo(() => {
    return (timeline || []).map((entry, index) => ({
      id: entry.id || `entry-${Date.now()}-${index}`,
      date: entry.date || new Date().toISOString(),
      patientNarrative: entry.patientNarrative || '',
      clinicalNotes: entry.clinicalNotes || '',
      orderIndex: entry.orderIndex || index,
      ...entry
    })).sort((a, b) => a.orderIndex - b.orderIndex);
  }, [timeline]);

  // Initialize entries
  useEffect(() => {
    setEntries(processedEntries);
  }, [processedEntries]);

  // Initialize canvas-based D3 simulation
  useEffect(() => {
    if (entries.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions with DPI scaling
    canvas.width = DPI * TIMELINE_WIDTH;
    canvas.height = DPI * dynamicTimelineHeight;
    canvas.style.width = `${TIMELINE_WIDTH}px`;
    canvas.style.height = `${dynamicTimelineHeight}px`;
    context.scale(DPI, DPI);

    // Create nodes with initial zigzag positions
    const nodes = entries.map((entry, index) => {
      const isLeft = index % 2 === 0;
      const initialX = TIMELINE_WIDTH / 2 + (isLeft ? -60 : 60);
      const initialY = 80 + (index * DYNAMIC_HEIGHT_FACTOR);
      
      return {
        id: entry.id,
        index,
        x: initialX,
        y: initialY,
        fx: pinnedNodes.has(entry.id) ? initialX : undefined,
        fy: pinnedNodes.has(entry.id) ? initialY : undefined,
        entry,
        side: isLeft ? 'left' : 'right',
        group: index % 3, // For color variation
        radius: NODE_RADIUS
      };
    });

    // Create links for timeline path
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i],
        target: nodes[i + 1],
        distance: DYNAMIC_HEIGHT_FACTOR
      });
    }

    nodesRef.current = nodes;
    linksRef.current = links;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create D3 force simulation
    simulationRef.current = forceSimulation(nodes)
      .force('link', forceLink(links).id(d => d.id).distance(d => d.distance).strength(0.1))
      .force('charge', forceManyBody().strength(-30))
      .force('center', forceCenter(TIMELINE_WIDTH / 2, dynamicTimelineHeight / 2))
      .force('collision', forceCollide().radius(NODE_RADIUS + 5))
      .alpha(0.1)
      .alphaDecay(0.05)
      .on('tick', draw);

    // Canvas drawing functions
    function draw() {
      context.clearRect(0, 0, TIMELINE_WIDTH, dynamicTimelineHeight);

      // Draw timeline path
      context.save();
      context.globalAlpha = 0.6;
      context.strokeStyle = '#3B82F6';
      context.lineWidth = 2;
      context.beginPath();
      links.forEach(drawLink);
      context.stroke();
      context.restore();

      // Draw nodes
      context.save();
      context.globalAlpha = 1;
      
      nodes.forEach(node => {
        context.beginPath();
        context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        
        // Node colors based on state
        if (editingEntryId === node.id) {
          context.fillStyle = '#2563EB';
          context.strokeStyle = '#60A5FA';
        } else if (pinnedNodes.has(node.id)) {
          context.fillStyle = '#7C3AED';
          context.strokeStyle = '#A78BFA';
        } else if (hoveredEntryId === node.id) {
          context.fillStyle = '#374151';
          context.strokeStyle = '#6B7280';
        } else {
          context.fillStyle = '#1E293B';
          context.strokeStyle = '#475569';
        }
        
        context.lineWidth = 2;
        context.fill();
        context.stroke();

        // Draw calendar icon (simplified)
        context.fillStyle = (editingEntryId === node.id || pinnedNodes.has(node.id)) ? '#FFFFFF' : '#94A3B8';
        context.font = '8px Arial';
        context.textAlign = 'center';
        context.fillText('📅', node.x, node.y + 2);

        // Draw pin indicator
        if (pinnedNodes.has(node.id)) {
          context.beginPath();
          context.arc(node.x + 6, node.y - 6, 3, 0, 2 * Math.PI);
          context.fillStyle = '#A78BFA';
          context.fill();
        }

        // Draw date label
        context.fillStyle = '#6B7280';
        context.font = '10px Arial';
        context.textAlign = 'center';
        const dateText = new Date(node.entry.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
        context.fillText(dateText, node.x, node.y + 25);
      });
      
      context.restore();
    }

    function drawLink(d) {
      context.moveTo(d.source.x, d.source.y);
      context.lineTo(d.target.x, d.target.y);
    }

    // Canvas interaction handlers
    const getPointerPosition = (event) => {
      const rect = canvas.getBoundingClientRect();
      return [
        (event.clientX - rect.left) * (canvas.width / rect.width) / DPI,
        (event.clientY - rect.top) * (canvas.height / rect.height) / DPI
      ];
    };

    const findNearestNode = (px, py) => {
      let closest = null;
      let minDist = Infinity;
      
      nodes.forEach(node => {
        const dist = Math.sqrt((node.x - px) ** 2 + (node.y - py) ** 2);
        if (dist < 20 && dist < minDist) {
          minDist = dist;
          closest = node;
        }
      });
      
      return closest;
    };

    // Mouse event handlers
    const handleMouseMove = (event) => {
      const [px, py] = getPointerPosition(event);
      const nearestNode = findNearestNode(px, py);
      
      if (nearestNode) {
        setHoveredEntryId(nearestNode.id);
        setHoveredNodePosition({ x: nearestNode.x, y: nearestNode.y, side: nearestNode.side });
        canvas.style.cursor = 'move';
      } else {
        setHoveredEntryId(null);
        setHoveredNodePosition(null);
        canvas.style.cursor = 'default';
      }
    };

    const handleClick = (event) => {
      const [px, py] = getPointerPosition(event);
      const nearestNode = findNearestNode(px, py);
      
      if (nearestNode) {
        setEditingEntryId(editingEntryId === nearestNode.id ? null : nearestNode.id);
        
        // Scroll to show the clicked node
        const container = timelineContainerRef.current;
        if (container) {
          const targetScrollTop = Math.max(0, nearestNode.y - container.clientHeight / 2);
          container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
        }
      }
    };

    const handleDoubleClick = (event) => {
      const [px, py] = getPointerPosition(event);
      const nearestNode = findNearestNode(px, py);
      
      if (nearestNode) {
        const newPinnedNodes = new Set(pinnedNodes);
        if (pinnedNodes.has(nearestNode.id)) {
          newPinnedNodes.delete(nearestNode.id);
          delete nearestNode.fx;
          delete nearestNode.fy;
        } else {
          newPinnedNodes.add(nearestNode.id);
          nearestNode.fx = nearestNode.x;
          nearestNode.fy = nearestNode.y;
        }
        setPinnedNodes(newPinnedNodes);
      }
    };

    // Add D3 drag behavior
    const dragBehavior = drag()
      .subject((event) => {
        const [px, py] = getPointerPosition(event);
        return findNearestNode(px, py);
      })
      .on('start', (event) => {
        if (!event.active) simulationRef.current.alphaTarget(0.1).restart();
        if (event.subject) {
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
      })
      .on('drag', (event) => {
        if (event.subject) {
          event.subject.fx = Math.max(NODE_RADIUS, Math.min(TIMELINE_WIDTH - NODE_RADIUS, event.x));
          event.subject.fy = Math.max(NODE_RADIUS, Math.min(dynamicTimelineHeight - NODE_RADIUS, event.y));
          
          // Auto-scroll during drag
          const container = timelineContainerRef.current;
          if (container && event.subject.fy) {
            const containerHeight = container.clientHeight;
            const scrollTop = container.scrollTop;
            const nodeVisibleY = event.subject.fy - scrollTop;
            
            if (nodeVisibleY < 50) {
              container.scrollTop = Math.max(0, event.subject.fy - 100);
            } else if (nodeVisibleY > containerHeight - 50) {
              container.scrollTop = event.subject.fy - containerHeight + 100;
            }
          }
        }
      })
      .on('end', (event) => {
        if (!event.active) simulationRef.current.alphaTarget(0);
        if (event.subject && !pinnedNodes.has(event.subject.id)) {
          delete event.subject.fx;
          delete event.subject.fy;
        }
      });

    // Apply event listeners
    select(canvas)
      .call(dragBehavior)
      .on('mousemove', handleMouseMove)
      .on('click', handleClick)
      .on('dblclick', handleDoubleClick);

    // Initial draw
    draw();

    // Cleanup
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

  }, [entries, pinnedNodes, editingEntryId, hoveredEntryId, dynamicTimelineHeight]);

  // Card positioning for hover cards
  const getCardPositions = useCallback(() => {
    if (!hoveredNodePosition) return null;

    const { x: nodeX, y: nodeY, side } = hoveredNodePosition;
    const cardWidth = 180;
    const cardHeight = 90;

    if (side === 'left') {
      return {
        patient: {
          x: nodeX - CARD_OFFSET - cardWidth,
          y: nodeY - cardHeight / 2 - 5
        },
        clinical: {
          x: nodeX + CARD_OFFSET,
          y: nodeY - cardHeight / 2 + 5
        }
      };
    } else {
      return {
        patient: {
          x: nodeX - CARD_OFFSET - cardWidth,
          y: nodeY - cardHeight / 2 + 5
        },
        clinical: {
          x: nodeX + CARD_OFFSET,
          y: nodeY - cardHeight / 2 - 5
        }
      };
    }
  }, [hoveredNodePosition]);

  // Entry management functions
  const updateEntry = useCallback((entryId, field, value) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  }, []);

  const saveEntry = useCallback(async (entryId) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry || isLoading) return;

    try {
      const updatedTimeline = entries.map(e => e.id === entryId ? entry : e);
      if (onUpdateTimeline) {
        await onUpdateTimeline(updatedTimeline);
      }
      setEditingEntryId(null);
      addToast?.('Entry saved', 'success');
    } catch (error) {
      console.error('Error saving entry:', error);
      addToast?.('Save failed', 'error');
    }
  }, [entries, onUpdateTimeline, addToast, isLoading]);

  const addEntry = useCallback(() => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString(),
      patientNarrative: '',
      clinicalNotes: '',
      orderIndex: entries.length,
      isNew: true
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    setEditingEntryId(newEntry.id);
    
    if (onUpdateTimeline) {
      onUpdateTimeline(updatedEntries);
    }

    // Scroll to new entry
    setTimeout(() => {
      const container = timelineContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }, [entries, onUpdateTimeline]);

  // Render hover-only cards
  const renderHoverCards = useCallback(() => {
    if (!hoveredEntryId || editingEntryId) return null;

    const cardPositions = getCardPositions();
    if (!cardPositions) return null;

    const entry = entries.find(e => e.id === hoveredEntryId);
    if (!entry) return null;

    return (
      <motion.div
        key={`hover-cards-${hoveredEntryId}`}
        className="absolute pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.15 }}
      >
        {/* Patient Hover Card */}
        <div
          className="absolute bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto"
          style={{
            left: cardPositions.patient.x,
            top: cardPositions.patient.y,
            width: 180,
            height: 90
          }}
        >
          <div className="absolute w-1 h-1 bg-blue-400 rounded-full -right-0.5 -bottom-0.5" />
          
          <div className="flex items-center gap-1 mb-1">
            <User size={12} className="text-blue-400" />
            <h4 className="font-medium text-white text-xs">Patient</h4>
          </div>
          
          <p className="text-slate-300 text-xs leading-tight overflow-hidden">
            {entry.patientNarrative || (
              <span className="text-slate-500 italic">No content</span>
            )}
          </p>
        </div>

        {/* Clinical Hover Card */}
        <div
          className="absolute bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto"
          style={{
            left: cardPositions.clinical.x,
            top: cardPositions.clinical.y,
            width: 180,
            height: 90
          }}
        >
          <div className="absolute w-1 h-1 bg-purple-400 rounded-full -left-0.5 -top-0.5" />
          
          <div className="flex items-center gap-1 mb-1">
            <Brain size={12} className="text-purple-400" />
            <h4 className="font-medium text-white text-xs">Clinical</h4>
          </div>
          
          <p className="text-slate-300 text-xs leading-tight overflow-hidden">
            {entry.clinicalNotes || (
              <span className="text-slate-500 italic">No notes</span>
            )}
          </p>
        </div>
      </motion.div>
    );
  }, [hoveredEntryId, editingEntryId, getCardPositions, entries]);

  // Render edit cards (only when editing)
  const renderEditCards = useCallback(() => {
    if (!editingEntryId) return null;

    const editingNode = nodesRef.current.find(n => n.id === editingEntryId);
    if (!editingNode) return null;

    const entry = entries.find(e => e.id === editingEntryId);
    if (!entry) return null;

    const cardWidth = 180;
    const cardHeight = 120;

    const cardPositions = editingNode.side === 'left' ? {
      patient: { x: editingNode.x - CARD_OFFSET - cardWidth, y: editingNode.y - cardHeight / 2 - 5 },
      clinical: { x: editingNode.x + CARD_OFFSET, y: editingNode.y - cardHeight / 2 + 5 }
    } : {
      patient: { x: editingNode.x - CARD_OFFSET - cardWidth, y: editingNode.y - cardHeight / 2 + 5 },
      clinical: { x: editingNode.x + CARD_OFFSET, y: editingNode.y - cardHeight / 2 - 5 }
    };

    return (
      <motion.div
        key={`edit-cards-${editingEntryId}`}
        className="absolute pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        {/* Patient Edit Card */}
        <div
          className="absolute bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto ring-1 ring-blue-400"
          style={{
            left: cardPositions.patient.x,
            top: cardPositions.patient.y,
            width: 180,
            height: 120
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <User size={12} className="text-blue-400" />
            <h4 className="font-medium text-white text-xs">Patient</h4>
          </div>
          
          <textarea
            value={entry.patientNarrative}
            onChange={(e) => updateEntry(entry.id, 'patientNarrative', e.target.value)}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-400 resize-none text-xs"
            placeholder="Patient narrative..."
            autoFocus
          />
        </div>

        {/* Clinical Edit Card */}
        <div
          className="absolute bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto ring-1 ring-purple-400"
          style={{
            left: cardPositions.clinical.x,
            top: cardPositions.clinical.y,
            width: 180,
            height: 120
          }}
        >
          <div className="flex items-center gap-1 mb-1">
            <Brain size={12} className="text-purple-400" />
            <h4 className="font-medium text-white text-xs">Clinical</h4>
          </div>
          
          <textarea
            value={entry.clinicalNotes}
            onChange={(e) => updateEntry(entry.id, 'clinicalNotes', e.target.value)}
            rows={3}
            className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-purple-400 resize-none text-xs"
            placeholder="Clinical notes..."
          />
        </div>

        {/* Edit Controls */}
        <div 
          className="absolute pointer-events-auto bg-slate-800 border border-slate-600 rounded p-1 shadow-lg z-50"
          style={{
            left: editingNode.x - 40,
            top: editingNode.y + 40
          }}
        >
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingEntryId(null);
              }}
              className="px-2 py-1 text-slate-300 hover:text-white border border-slate-600 rounded hover:bg-slate-700 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                saveEntry(entry.id);
              }}
              disabled={isLoading}
              className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs flex items-center gap-1"
            >
              {isLoading ? <Loader2 size={8} className="animate-spin" /> : <Save size={8} />}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    );
  }, [editingEntryId, entries, updateEntry, saveEntry, isLoading]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className="h-full p-3 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Clock size={14} className="text-cyan-400" />
          Timeline
          <span className="text-xs text-slate-500">Hover • Drag • Double-click to pin</span>
        </h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Scrollable Canvas Timeline Container */}
      <div 
        ref={timelineContainerRef}
        className="relative bg-slate-900/40 rounded border border-slate-700 mx-auto overflow-y-auto"
        style={{ 
          width: TIMELINE_WIDTH, 
          height: TIMELINE_HEIGHT,
          scrollBehavior: 'smooth'
        }}
      >
        {entries.length > 0 ? (
          <>
            {/* Canvas Timeline */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0"
              style={{ zIndex: 1 }}
            />
            
            {/* Hover Cards Layer */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
              <AnimatePresence>
                {renderHoverCards()}
                {renderEditCards()}
              </AnimatePresence>
            </div>
          </>
        ) : (
          // Empty State
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Clock size={24} className="text-slate-600 mx-auto mb-2" />
              <h4 className="text-sm font-medium text-slate-400 mb-1">No Entries</h4>
              <p className="text-slate-500 text-xs mb-2">Add your first timeline entry</p>
              <button
                onClick={addEntry}
                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs mx-auto"
              >
                <Plus size={10} />
                Add Entry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close edit */}
      {editingEntryId && (
        <div 
          className="fixed inset-0 z-15" 
          onClick={() => setEditingEntryId(null)}
        />
      )}
    </motion.div>
  );
});

AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;