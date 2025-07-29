// Angular Timeline Component with D3-Inspired Physics
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Edit3,
  Save,
  X,
  Loader2,
  User,
  Brain,
  GripVertical,
  Pin,
  PinOff
} from 'lucide-react';
import { forceSimulation, forceManyBody, forceCenter, forceLink, forceCollide } from 'd3-force';

// Animation variants
const timelineVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  popIn: {
    scale: [0.3, 1.1, 1],
    opacity: [0, 1, 1],
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(10px)",
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

const AngularTimeline = ({ 
  timeline = [], 
  onUpdateTimeline, 
  isLoading = false,
  addToast 
}) => {
  const [entries, setEntries] = useState([]);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [hoveredEntryId, setHoveredEntryId] = useState(null);
  const [hoveredConnectorIndex, setHoveredConnectorIndex] = useState(null);
  const [draggedEntry, setDraggedEntry] = useState(null);
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const [nodePositions, setNodePositions] = useState(new Map());
  const timelineRef = useRef(null);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const isDraggingRef = useRef(false);

  // Timeline layout constants
  const TIMELINE_WIDTH = 800;
  const TIMELINE_HEIGHT = 600;
  const ZIGZAG_AMPLITUDE = 150; // How far left/right the zigzag goes
  const VERTICAL_SPACING = 120; // Base vertical spacing
  const NODE_RADIUS = 24;

  // Initialize entries and create D3 simulation
  useEffect(() => {
    const sortedEntries = (timeline || []).map((entry, index) => ({
      id: entry.id || `entry-${Date.now()}-${index}`,
      date: entry.date || new Date().toISOString(),
      patientNarrative: entry.patientNarrative || '',
      clinicalNotes: entry.clinicalNotes || '',
      orderIndex: entry.orderIndex || index,
      ...entry
    })).sort((a, b) => a.orderIndex - b.orderIndex);
    
    setEntries(sortedEntries);
    initializeSimulation(sortedEntries);
  }, [timeline]);

  // Initialize D3 force simulation
  const initializeSimulation = useCallback((entriesData) => {
    if (entriesData.length === 0) return;

    // Create nodes with initial zigzag positions
    const nodes = entriesData.map((entry, index) => {
      const zigzagSide = index % 2 === 0 ? -1 : 1;
      const baseX = TIMELINE_WIDTH / 2 + (zigzagSide * ZIGZAG_AMPLITUDE);
      const baseY = 80 + (index * VERTICAL_SPACING);
      
      return {
        id: entry.id,
        index,
        x: baseX,
        y: baseY,
        fx: pinnedNodes.has(entry.id) ? baseX : undefined,
        fy: pinnedNodes.has(entry.id) ? baseY : undefined,
        entry,
        side: zigzagSide === -1 ? 'left' : 'right'
      };
    });

    // Create links between consecutive nodes
    const links = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i],
        target: nodes[i + 1],
        distance: VERTICAL_SPACING
      });
    }

    nodesRef.current = nodes;
    linksRef.current = links;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create new simulation
    simulationRef.current = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-100))
      .force('center', forceCenter(TIMELINE_WIDTH / 2, TIMELINE_HEIGHT / 2))
      .force('link', forceLink(links).distance(d => d.distance).strength(0.3))
      .force('collision', forceCollide().radius(NODE_RADIUS + 10))
      .on('tick', () => {
        // Update node positions
        const newPositions = new Map();
        nodes.forEach(node => {
          newPositions.set(node.id, { x: node.x, y: node.y });
        });
        setNodePositions(newPositions);
      })
      .alpha(0.3)
      .alphaDecay(0.05);

  }, [pinnedNodes]);

  // Handle node dragging
  const handleDragStart = useCallback((e, nodeId) => {
    isDraggingRef.current = true;
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      node.fx = node.x;
      node.fy = node.y;
      simulationRef.current.alphaTarget(0.3).restart();
    }
    e.preventDefault();
  }, []);

  const handleDrag = useCallback((e, nodeId) => {
    if (!isDraggingRef.current) return;
    
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Clamp to timeline bounds
      node.fx = Math.max(NODE_RADIUS, Math.min(TIMELINE_WIDTH - NODE_RADIUS, x));
      node.fy = Math.max(NODE_RADIUS, Math.min(TIMELINE_HEIGHT - NODE_RADIUS, y));
      
      simulationRef.current.alpha(0.3).restart();
    }
  }, []);

  const handleDragEnd = useCallback((e, nodeId) => {
    isDraggingRef.current = false;
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node && simulationRef.current) {
      if (!pinnedNodes.has(nodeId)) {
        delete node.fx;
        delete node.fy;
      }
      simulationRef.current.alphaTarget(0);
    }
  }, [pinnedNodes]);

  // Handle node click to pin/unpin
  const handleNodeClick = useCallback((nodeId) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;

    const newPinnedNodes = new Set(pinnedNodes);
    
    if (pinnedNodes.has(nodeId)) {
      // Unpin the node
      newPinnedNodes.delete(nodeId);
      delete node.fx;
      delete node.fy;
      if (simulationRef.current) {
        simulationRef.current.alpha(0.3).restart();
      }
    } else {
      // Pin the node
      newPinnedNodes.add(nodeId);
      node.fx = node.x;
      node.fy = node.y;
    }
    
    setPinnedNodes(newPinnedNodes);
  }, [pinnedNodes]);

  // Calculate card positions based on node position and side
  const getCardPositions = useCallback((nodeId) => {
    const position = nodePositions.get(nodeId);
    if (!position) return null;

    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return null;

    const { x: nodeX, y: nodeY } = position;
    const cardWidth = 280;
    const cardHeight = 120;
    const offsetDistance = 100;

    if (node.side === 'left') {
      return {
        patient: {
          x: nodeX - offsetDistance - cardWidth,
          y: nodeY - cardHeight / 2 - 10,
          anchorX: nodeX - NODE_RADIUS * 0.7,
          anchorY: nodeY + NODE_RADIUS * 0.7,
          connectionCorner: 'bottom-right'
        },
        clinical: {
          x: nodeX + offsetDistance,
          y: nodeY + 10,
          anchorX: nodeX - NODE_RADIUS * 0.7,
          anchorY: nodeY - NODE_RADIUS * 0.7,
          connectionCorner: 'top-left'
        }
      };
    } else {
      return {
        patient: {
          x: nodeX - offsetDistance - cardWidth,
          y: nodeY + 10,
          anchorX: nodeX + NODE_RADIUS * 0.7,
          anchorY: nodeY + NODE_RADIUS * 0.7,
          connectionCorner: 'bottom-right'
        },
        clinical: {
          x: nodeX + offsetDistance,
          y: nodeY - cardHeight / 2 - 10,
          anchorX: nodeX + NODE_RADIUS * 0.7,
          anchorY: nodeY - NODE_RADIUS * 0.7,
          connectionCorner: 'top-right'
        }
      };
    }
  }, [nodePositions]);

  // Handle entry updates
  const updateEntry = useCallback((entryId, field, value) => {
    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  }, []);

  // Save entry changes
  const saveEntry = useCallback(async (entryId) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    try {
      const updatedTimeline = entries.map(e => e.id === entryId ? entry : e);
      if (onUpdateTimeline) {
        await onUpdateTimeline(updatedTimeline);
      }
      setEditingEntryId(null);
      addToast?.('Timeline entry updated successfully', 'success');
    } catch (error) {
      console.error('Error saving timeline entry:', error);
      addToast?.('Failed to save timeline entry', 'error');
    }
  }, [entries, onUpdateTimeline, addToast]);

  // Add new entry
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
  }, [entries, onUpdateTimeline]);

  // Generate SVG path for timeline backbone
  const generateTimelinePath = useCallback(() => {
    if (nodesRef.current.length === 0) return '';
    
    let pathData = '';
    nodesRef.current.forEach((node, index) => {
      const position = nodePositions.get(node.id);
      if (position) {
        if (index === 0) {
          pathData += `M ${position.x} ${position.y}`;
        } else {
          pathData += ` L ${position.x} ${position.y}`;
        }
      }
    });
    
    return pathData;
  }, [nodePositions]);

  // Render floating cards
  const renderFloatingCards = useCallback((entry) => {
    if (hoveredEntryId !== entry.id && editingEntryId !== entry.id) return null;

    const cardPositions = getCardPositions(entry.id);
    if (!cardPositions) return null;

    const isEditing = editingEntryId === entry.id;

    return (
      <AnimatePresence key={`cards-${entry.id}`}>
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Patient Narrative Card */}
          <motion.div
            className={`absolute bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl pointer-events-auto ${
              isEditing ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: cardPositions.patient.x,
              top: cardPositions.patient.y,
              width: 280,
              minHeight: 120
            }}
            variants={cardVariants}
            whileHover={!isEditing ? "hover" : undefined}
          >
            {/* Connection line */}
            <svg 
              className="absolute pointer-events-none"
              style={{
                left: cardPositions.patient.connectionCorner === 'bottom-right' ? '100%' : '0%',
                top: cardPositions.patient.connectionCorner === 'bottom-right' ? '100%' : '0%',
                transform: 'translate(-50%, -50%)'
              }}
              width="60"
              height="60"
            >
              <line
                x1="30"
                y1="30"
                x2={cardPositions.patient.anchorX - cardPositions.patient.x + (cardPositions.patient.connectionCorner === 'bottom-right' ? -280 : 0)}
                y2={cardPositions.patient.anchorY - cardPositions.patient.y + (cardPositions.patient.connectionCorner === 'bottom-right' ? -120 : 0)}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.7"
              />
              <circle cx="30" cy="30" r="3" fill="#3B82F6" />
            </svg>
            
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-blue-400" />
              <h4 className="font-semibold text-white text-sm">Patient Narrative</h4>
            </div>
            
            {isEditing ? (
              <textarea
                value={entry.patientNarrative}
                onChange={(e) => updateEntry(entry.id, 'patientNarrative', e.target.value)}
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                placeholder="Enter patient narrative or session content..."
                autoFocus
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">
                {entry.patientNarrative || (
                  <span className="text-slate-500 italic">No patient narrative documented</span>
                )}
              </p>
            )}
          </motion.div>

          {/* Clinical Notes Card */}
          <motion.div
            className={`absolute bg-slate-800/95 backdrop-blur-md border border-slate-600 rounded-xl p-4 shadow-2xl pointer-events-auto ${
              isEditing ? 'ring-2 ring-purple-500' : ''
            }`}
            style={{
              left: cardPositions.clinical.x,
              top: cardPositions.clinical.y,
              width: 280,
              minHeight: 120
            }}
            variants={cardVariants}
            whileHover={!isEditing ? "hover" : undefined}
          >
            {/* Connection line */}
            <svg 
              className="absolute pointer-events-none"
              style={{
                left: cardPositions.clinical.connectionCorner.includes('left') ? '0%' : '100%',
                top: cardPositions.clinical.connectionCorner.includes('top') ? '0%' : '100%',
                transform: 'translate(-50%, -50%)'
              }}
              width="60"
              height="60"
            >
              <line
                x1="30"
                y1="30"
                x2={cardPositions.clinical.anchorX - cardPositions.clinical.x - (cardPositions.clinical.connectionCorner.includes('right') ? 280 : 0)}
                y2={cardPositions.clinical.anchorY - cardPositions.clinical.y - (cardPositions.clinical.connectionCorner.includes('bottom') ? 120 : 0)}
                stroke="#A855F7"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.7"
              />
              <circle cx="30" cy="30" r="3" fill="#A855F7" />
            </svg>
            
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-purple-400" />
              <h4 className="font-semibold text-white text-sm">Clinical Process Notes</h4>
            </div>
            
            {isEditing ? (
              <textarea
                value={entry.clinicalNotes}
                onChange={(e) => updateEntry(entry.id, 'clinicalNotes', e.target.value)}
                rows={4}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
                placeholder="Enter clinical insights, countertransference, hypotheses..."
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">
                {entry.clinicalNotes || (
                  <span className="text-slate-500 italic">No clinical notes documented</span>
                )}
              </p>
            )}
          </motion.div>

          {/* Edit Controls */}
          {isEditing && (
            <motion.div 
              className="absolute pointer-events-auto bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3 shadow-xl z-50"
              style={{
                left: nodePositions.get(entry.id)?.x - 80 || 0,
                top: (nodePositions.get(entry.id)?.y || 0) + 80
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingEntryId(null);
                  }}
                  className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    saveEntry(entry.id);
                  }}
                  disabled={isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }, [hoveredEntryId, editingEntryId, getCardPositions, nodePositions, updateEntry, saveEntry, isLoading]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return (
    <motion.div
      className="h-full overflow-hidden p-6 relative"
      variants={timelineVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock size={20} className="text-cyan-400" />
          Clinical Timeline
          <span className="text-xs text-slate-400 ml-2">Drag nodes • Click to pin/unpin</span>
        </h3>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={addEntry}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          <Plus size={16} />
          Add Entry
        </motion.button>
      </div>

      {/* Timeline Simulation Container */}
      <div 
        ref={timelineRef}
        className="relative bg-slate-900/50 rounded-xl border border-slate-700"
        style={{ width: TIMELINE_WIDTH, height: TIMELINE_HEIGHT, margin: '0 auto' }}
      >
        {/* Timeline Path */}
        {entries.length > 0 && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path
              d={generateTimelinePath()}
              stroke="url(#timelineGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
          </svg>
        )}

        {/* Timeline Nodes */}
        <AnimatePresence>
          {entries.map((entry) => {
            const position = nodePositions.get(entry.id);
            if (!position) return null;

            const isPinned = pinnedNodes.has(entry.id);
            const isHovered = hoveredEntryId === entry.id;
            const isEditing = editingEntryId === entry.id;

            return (
              <React.Fragment key={entry.id}>
                {/* Timeline Node */}
                <motion.div
                  className="absolute cursor-move select-none"
                  style={{ 
                    left: position.x - NODE_RADIUS, 
                    top: position.y - NODE_RADIUS,
                    zIndex: isEditing ? 10 : 5
                  }}
                  variants={entry.isNew ? nodeVariants.popIn : nodeVariants}
                  initial={entry.isNew ? undefined : "hidden"}
                  animate="visible"
                  exit="hidden"
                  onMouseDown={(e) => handleDragStart(e, entry.id)}
                  onMouseMove={(e) => handleDrag(e, entry.id)}
                  onMouseUp={(e) => handleDragEnd(e, entry.id)}
                  onMouseEnter={() => setHoveredEntryId(entry.id)}
                  onMouseLeave={() => setHoveredEntryId(null)}
                  onClick={() => {
                    if (!isDraggingRef.current) {
                      if (isEditing) {
                        setEditingEntryId(null);
                      } else {
                        setEditingEntryId(entry.id);
                      }
                    }
                  }}
                  onDoubleClick={() => handleNodeClick(entry.id)}
                >
                  <motion.div
                    className={`relative w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all ${
                      isEditing
                        ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50' 
                        : isPinned
                        ? 'bg-purple-600 border-purple-400 shadow-lg shadow-purple-500/50'
                        : isHovered
                        ? 'bg-slate-700 border-slate-500 shadow-lg'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar size={18} className={
                      isEditing || isPinned ? 'text-white' : 'text-slate-400'
                    } />
                    
                    {/* Pin indicator */}
                    {isPinned && (
                      <div className="absolute -top-1 -right-1">
                        <Pin size={12} className="text-purple-400" />
                      </div>
                    )}
                  </motion.div>

                  {/* Date Label */}
                  <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-xs text-slate-400 font-medium">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>

                {/* Floating Cards */}
                {renderFloatingCards(entry)}
              </React.Fragment>
            );
          })}
        </AnimatePresence>

        {/* Empty State */}
        {entries.length === 0 && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <Clock size={48} className="text-slate-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-400 mb-2">No Timeline Entries</h4>
              <p className="text-slate-500 text-sm mb-6">Add your first timeline entry to start the physics simulation</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addEntry}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg mx-auto"
              >
                <Plus size={16} />
                Add First Entry
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-xs text-slate-500">
        <p>Drag nodes to reposition • Click to edit • Double-click to pin/unpin • Hover for cards</p>
      </div>

      {/* Click outside to close edit mode */}
      {editingEntryId && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setEditingEntryId(null)}
        />
      )}
    </motion.div>
  );
};

export default AngularTimeline;