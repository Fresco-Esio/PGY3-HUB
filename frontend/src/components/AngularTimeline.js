// Angular Timeline Component for Case Modal - Refined Zigzag Layout
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
  GripVertical
} from 'lucide-react';

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
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

const connectorVariants = {
  inactive: {
    opacity: 0.3,
    filter: "drop-shadow(0 0 0px rgba(59, 130, 246, 0))"
  },
  hover: {
    opacity: 1,
    filter: "drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))",
    transition: {
      duration: 0.3,
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
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const timelineRef = useRef(null);
  const cardRefs = useRef({});

  // Timeline layout constants for angular zigzag
  const ZIGZAG_WIDTH = 300; // Horizontal distance between left and right positions
  const VERTICAL_SPACING = 180; // Vertical spacing between nodes
  const TIMELINE_CENTER_X = 400; // Center X position of the timeline

  // Initialize entries with order index
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
  }, [timeline]);

  // Calculate angular zigzag node positioning
  const getNodePosition = useCallback((index) => {
    const isLeft = index % 2 === 0;
    const x = TIMELINE_CENTER_X + (isLeft ? -ZIGZAG_WIDTH / 2 : ZIGZAG_WIDTH / 2);
    const y = index * VERTICAL_SPACING + 100; // Start offset from top
    
    return {
      x,
      y,
      side: isLeft ? 'left' : 'right'
    };
  }, []);

  // Get card anchor positions based on node position and bend direction
  const getCardAnchorPositions = useCallback((nodePos, nodeIndex) => {
    const { x: nodeX, y: nodeY, side } = nodePos;
    const cardWidth = 280;
    const cardHeight = 120;
    const cardSpacing = 20;
    const offsetDistance = 80;

    if (side === 'left') {
      // Left bend: Patient card (left) connects via bottom-right, Clinical card (right) connects via top-left
      return {
        patient: {
          x: nodeX - offsetDistance - cardWidth,
          y: nodeY - cardHeight / 2 - cardSpacing / 2,
          anchorPoint: { x: cardWidth, y: cardHeight }, // Bottom-right of card
          connectionCorner: 'bottom-right'
        },
        clinical: {
          x: nodeX + offsetDistance,
          y: nodeY + cardSpacing / 2,
          anchorPoint: { x: 0, y: 0 }, // Top-left of card
          connectionCorner: 'top-left'
        }
      };
    } else {
      // Right bend: Patient card (left) connects via top-right, Clinical card (right) connects via bottom-left
      return {
        patient: {
          x: nodeX - offsetDistance - cardWidth,
          y: nodeY + cardSpacing / 2,
          anchorPoint: { x: cardWidth, y: 0 }, // Top-right of card
          connectionCorner: 'top-right'
        },
        clinical: {
          x: nodeX + offsetDistance,
          y: nodeY - cardHeight / 2 - cardSpacing / 2,
          anchorPoint: { x: 0, y: cardHeight }, // Bottom-left of card
          connectionCorner: 'bottom-left'
        }
      };
    }
  }, []);

  // Generate zigzag path SVG
  const generateZigzagPath = useCallback(() => {
    if (entries.length === 0) return '';
    
    let pathData = '';
    entries.forEach((entry, index) => {
      const pos = getNodePosition(index);
      if (index === 0) {
        pathData += `M ${pos.x} ${pos.y}`;
      } else {
        pathData += ` L ${pos.x} ${pos.y}`;
      }
    });
    
    return pathData;
  }, [entries, getNodePosition]);

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
    
    // Scroll to show new entry
    setTimeout(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollTop = timelineRef.current.scrollHeight;
      }
    }, 100);
  }, [entries, onUpdateTimeline]);

  // Insert entry at specific position
  const insertEntry = useCallback((afterIndex) => {
    const newEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString(),
      patientNarrative: '',
      clinicalNotes: '',
      orderIndex: afterIndex + 0.5,
      isNew: true
    };
    
    // Reorder entries to make room
    const updatedEntries = [...entries, newEntry]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((entry, index) => ({ ...entry, orderIndex: index }));
    
    setEntries(updatedEntries);
    setEditingEntryId(newEntry.id);
    
    if (onUpdateTimeline) {
      onUpdateTimeline(updatedEntries);
    }
  }, [entries, onUpdateTimeline]);

  // Handle drag and drop
  const handleDragStart = useCallback((e, entry) => {
    setDraggedEntry(entry);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e, dropIndex) => {
    e.preventDefault();
    
    if (!draggedEntry || draggedEntry.orderIndex === dropIndex) {
      setDraggedEntry(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder entries
    const reorderedEntries = [...entries]
      .filter(entry => entry.id !== draggedEntry.id);
    
    reorderedEntries.splice(dropIndex, 0, draggedEntry);
    
    const updatedEntries = reorderedEntries.map((entry, index) => ({
      ...entry,
      orderIndex: index
    }));

    setEntries(updatedEntries);
    setDraggedEntry(null);
    setDragOverIndex(null);
    
    if (onUpdateTimeline) {
      onUpdateTimeline(updatedEntries);
    }
  }, [draggedEntry, entries, onUpdateTimeline]);

  // Render floating cards with corner connections
  const renderFloatingCards = useCallback((entry, nodePos, nodeIndex) => {
    if (hoveredEntryId !== entry.id && editingEntryId !== entry.id) return null;

    const isEditing = editingEntryId === entry.id;
    const cardPositions = getCardAnchorPositions(nodePos, nodeIndex);

    return (
      <AnimatePresence>
        <motion.div
          key={`cards-${entry.id}`}
          className="absolute z-50 pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%'
          }}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={{
            hidden: { opacity: 0, scale: 0.9, y: 20 },
            visible: { opacity: 1, scale: 1, y: 0 }
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Patient Narrative Card */}
          <motion.div
            className={`absolute bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-xl pointer-events-auto ${
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
            {/* Connection line to node */}
            <svg 
              className="absolute pointer-events-none"
              style={{
                left: cardPositions.patient.anchorPoint.x,
                top: cardPositions.patient.anchorPoint.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <line
                x1="0"
                y1="0"
                x2={nodePos.x - (cardPositions.patient.x + cardPositions.patient.anchorPoint.x)}
                y2={nodePos.y - (cardPositions.patient.y + cardPositions.patient.anchorPoint.y)}
                stroke="#3B82F6"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              <circle cx="0" cy="0" r="3" fill="#3B82F6" />
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
            className={`absolute bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-xl pointer-events-auto ${
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
            {/* Connection line to node */}
            <svg 
              className="absolute pointer-events-none"
              style={{
                left: cardPositions.clinical.anchorPoint.x,
                top: cardPositions.clinical.anchorPoint.y,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <line
                x1="0"
                y1="0"
                x2={nodePos.x - (cardPositions.clinical.x + cardPositions.clinical.anchorPoint.x)}
                y2={nodePos.y - (cardPositions.clinical.y + cardPositions.clinical.anchorPoint.y)}
                stroke="#A855F7"
                strokeWidth="2"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              <circle cx="0" cy="0" r="3" fill="#A855F7" />
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
              className="absolute pointer-events-auto bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-3 shadow-xl"
              style={{
                left: nodePos.x - 80,
                top: nodePos.y + 80,
                zIndex: 60
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
  }, [hoveredEntryId, editingEntryId, getCardAnchorPositions, updateEntry, saveEntry, isLoading]);

  return (
    <motion.div
      ref={timelineRef}
      className="h-full overflow-y-auto p-6 relative"
      variants={timelineVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with Add Entry Button */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock size={20} className="text-cyan-400" />
          Clinical Timeline
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

      {/* Timeline Container */}
      <div className="relative min-h-[600px]" style={{ width: '800px', margin: '0 auto' }}>
        {/* Angular Zigzag Timeline Path */}
        {entries.length > 0 && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          >
            <defs>
              <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>
            </defs>
            <path
              d={generateZigzagPath()}
              stroke="url(#timelineGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Timeline Entries */}
        <AnimatePresence>
          {entries.map((entry, index) => {
            const nodePos = getNodePosition(index);
            const isDragging = draggedEntry?.id === entry.id;
            const isDragOver = dragOverIndex === index;

            return (
              <React.Fragment key={entry.id}>
                {/* Connector hover zones for insertion */}
                {index > 0 && (
                  <motion.div
                    className="absolute cursor-pointer"
                    style={{
                      left: (getNodePosition(index - 1).x + nodePos.x) / 2 - 20,
                      top: (getNodePosition(index - 1).y + nodePos.y) / 2 - 20,
                      width: 40,
                      height: 40,
                      zIndex: 2
                    }}
                    variants={connectorVariants}
                    animate={hoveredConnectorIndex === index ? "hover" : "inactive"}
                    onMouseEnter={() => setHoveredConnectorIndex(index)}
                    onMouseLeave={() => setHoveredConnectorIndex(null)}
                    onDoubleClick={() => insertEntry(index - 1)}
                  >
                    <div className="w-full h-full rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center">
                      {hoveredConnectorIndex === index && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Plus size={16} className="text-blue-400" />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Timeline Node */}
                <motion.div
                  className={`absolute ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'scale-105' : ''}`}
                  style={{ 
                    left: nodePos.x - 24, 
                    top: nodePos.y - 24, 
                    zIndex: 3 
                  }}
                  variants={entry.isNew ? nodeVariants.popIn : nodeVariants}
                  initial={entry.isNew ? undefined : "hidden"}
                  animate="visible"
                  exit="hidden"
                  draggable
                  onDragStart={(e) => handleDragStart(e, entry)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onMouseEnter={() => setHoveredEntryId(entry.id)}
                  onMouseLeave={() => setHoveredEntryId(null)}
                  onClick={() => {
                    if (editingEntryId && editingEntryId !== entry.id) {
                      setEditingEntryId(null);
                    } else if (!editingEntryId) {
                      setEditingEntryId(entry.id);
                    }
                  }}
                >
                  {/* Node Circle */}
                  <motion.div
                    className={`relative w-12 h-12 rounded-full border-4 cursor-pointer flex items-center justify-center ${
                      editingEntryId === entry.id 
                        ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50' 
                        : hoveredEntryId === entry.id
                        ? 'bg-slate-700 border-slate-500 shadow-lg'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar size={18} className={
                      editingEntryId === entry.id ? 'text-white' : 'text-slate-400'
                    } />
                    
                    {/* Drag Handle */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical size={12} className="text-slate-400" />
                    </div>
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

                  {/* Floating Cards */}
                  {renderFloatingCards(entry, nodePos, index)}
                </motion.div>
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
              <p className="text-slate-500 text-sm mb-6">Add your first timeline entry to start documenting the case progression</p>
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

      {/* Click outside to close edit mode */}
      {editingEntryId && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setEditingEntryId(null)}
        />
      )}
    </motion.div>
  );
};

export default AngularTimeline;