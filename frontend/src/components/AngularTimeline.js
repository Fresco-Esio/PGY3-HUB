// Optimized Angular Timeline - Simplified High Performance Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

// Minimal animation variants for maximum performance
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } }
};

const nodeVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } }
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
  const [pinnedNodes, setPinnedNodes] = useState(new Set());
  const [draggedNode, setDraggedNode] = useState(null);

  // Optimized layout constants
  const TIMELINE_WIDTH = 600;
  const TIMELINE_HEIGHT = 350;
  const ZIGZAG_AMPLITUDE = 60; // Further reduced for better card positioning
  const VERTICAL_SPACING = 70; // Reduced spacing
  const NODE_RADIUS = 18; // Smaller nodes
  const CARD_OFFSET = 30; // Very close to nodes

  // Memoized entries processing - no D3, just simple positioning
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

  // Simple static positioning - no physics simulation
  const getNodePosition = useCallback((index) => {
    const isLeft = index % 2 === 0;
    const x = TIMELINE_WIDTH / 2 + (isLeft ? -ZIGZAG_AMPLITUDE : ZIGZAG_AMPLITUDE);
    const y = 60 + (index * VERTICAL_SPACING);
    
    return {
      x,
      y,
      side: isLeft ? 'left' : 'right'
    };
  }, [TIMELINE_WIDTH, ZIGZAG_AMPLITUDE, VERTICAL_SPACING]);

  // Initialize entries
  useEffect(() => {
    setEntries(processedEntries);
  }, [processedEntries]);

  // Simple card positioning - much closer to nodes
  const getCardPositions = useCallback((index) => {
    const nodePos = getNodePosition(index);
    const cardWidth = 180; // Even smaller cards
    const cardHeight = 90;

    if (nodePos.side === 'left') {
      return {
        patient: {
          x: nodePos.x - CARD_OFFSET - cardWidth,
          y: nodePos.y - cardHeight / 2 - 5
        },
        clinical: {
          x: nodePos.x + CARD_OFFSET,
          y: nodePos.y - cardHeight / 2 + 5
        }
      };
    } else {
      return {
        patient: {
          x: nodePos.x - CARD_OFFSET - cardWidth,
          y: nodePos.y - cardHeight / 2 + 5
        },
        clinical: {
          x: nodePos.x + CARD_OFFSET,
          y: nodePos.y - cardHeight / 2 - 5
        }
      };
    }
  }, [getNodePosition, CARD_OFFSET]);

  // Simple zigzag path generation
  const timelinePath = useMemo(() => {
    if (entries.length === 0) return '';
    
    let pathData = '';
    entries.forEach((entry, index) => {
      const pos = getNodePosition(index);
      pathData += index === 0 ? `M ${pos.x} ${pos.y}` : ` L ${pos.x} ${pos.y}`;
    });
    return pathData;
  }, [entries, getNodePosition]);

  // Optimized update and save functions
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
  }, [entries, onUpdateTimeline]);

  // Simple drag handling without physics
  const handleMouseDown = useCallback((e, entryId) => {
    setDraggedNode(entryId);
    e.preventDefault();
  }, []);

  const handleDoubleClick = useCallback((entryId) => {
    const newPinnedNodes = new Set(pinnedNodes);
    if (pinnedNodes.has(entryId)) {
      newPinnedNodes.delete(entryId);
    } else {
      newPinnedNodes.add(entryId);
    }
    setPinnedNodes(newPinnedNodes);
  }, [pinnedNodes]);

  // Simplified floating cards render
  const renderFloatingCards = useCallback((entry, index) => {
    if (hoveredEntryId !== entry.id && editingEntryId !== entry.id) return null;

    const cardPositions = getCardPositions(index);
    const isEditing = editingEntryId === entry.id;

    return (
      <motion.div
        key={`cards-${entry.id}`}
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }} // Very fast transitions
      >
        {/* Patient Card */}
        <div
          className={`absolute bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto ${
            isEditing ? 'ring-1 ring-blue-400' : ''
          }`}
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
          
          {isEditing ? (
            <textarea
              value={entry.patientNarrative}
              onChange={(e) => updateEntry(entry.id, 'patientNarrative', e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-blue-400 resize-none text-xs"
              placeholder="Patient narrative..."
              autoFocus
            />
          ) : (
            <p className="text-slate-300 text-xs leading-tight overflow-hidden">
              {entry.patientNarrative || (
                <span className="text-slate-500 italic">No content</span>
              )}
            </p>
          )}
        </div>

        {/* Clinical Card */}
        <div
          className={`absolute bg-slate-800/95 border border-slate-600 rounded-lg p-2 shadow-lg pointer-events-auto ${
            isEditing ? 'ring-1 ring-purple-400' : ''
          }`}
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
          
          {isEditing ? (
            <textarea
              value={entry.clinicalNotes}
              onChange={(e) => updateEntry(entry.id, 'clinicalNotes', e.target.value)}
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white placeholder-slate-400 focus:ring-1 focus:ring-purple-400 resize-none text-xs"
              placeholder="Clinical notes..."
            />
          ) : (
            <p className="text-slate-300 text-xs leading-tight overflow-hidden">
              {entry.clinicalNotes || (
                <span className="text-slate-500 italic">No notes</span>
              )}
            </p>
          )}
        </div>

        {/* Compact Edit Controls */}
        {isEditing && (
          <div 
            className="absolute pointer-events-auto bg-slate-800 border border-slate-600 rounded p-1 shadow-lg z-50"
            style={{
              left: getNodePosition(index).x - 40,
              top: getNodePosition(index).y + 30
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
        )}
      </motion.div>
    );
  }, [hoveredEntryId, editingEntryId, getCardPositions, getNodePosition, updateEntry, saveEntry, isLoading]);

  return (
    <motion.div
      className="h-full p-3 relative"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Minimal Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Clock size={14} className="text-cyan-400" />
          Timeline
          <span className="text-xs text-slate-500">Drag • Double-click to pin</span>
        </h3>
        <button
          onClick={addEntry}
          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {/* Simplified Timeline Container */}
      <div 
        className="relative bg-slate-900/40 rounded border border-slate-700 mx-auto"
        style={{ width: TIMELINE_WIDTH, height: TIMELINE_HEIGHT }}
      >
        {/* Simple Timeline Path */}
        {entries.length > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <linearGradient id="simpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748B" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path
              d={timelinePath}
              stroke="url(#simpleGradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        )}

        {/* Simple Timeline Nodes */}
        <AnimatePresence>
          {entries.map((entry, index) => {
            const nodePos = getNodePosition(index);
            const isPinned = pinnedNodes.has(entry.id);
            const isHovered = hoveredEntryId === entry.id;
            const isEditing = editingEntryId === entry.id;

            return (
              <React.Fragment key={entry.id}>
                <motion.div
                  className="absolute cursor-move select-none"
                  style={{ 
                    left: nodePos.x - NODE_RADIUS, 
                    top: nodePos.y - NODE_RADIUS,
                    zIndex: isEditing ? 10 : 5
                  }}
                  variants={nodeVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  onMouseDown={(e) => handleMouseDown(e, entry.id)}
                  onMouseEnter={() => setHoveredEntryId(entry.id)}
                  onMouseLeave={() => setHoveredEntryId(null)}
                  onClick={() => setEditingEntryId(isEditing ? null : entry.id)}
                  onDoubleClick={() => handleDoubleClick(entry.id)}
                >
                  <div
                    className={`relative rounded-full border-2 flex items-center justify-center transition-colors ${
                      isEditing
                        ? 'bg-blue-600 border-blue-400' 
                        : isPinned
                        ? 'bg-purple-600 border-purple-400'
                        : isHovered
                        ? 'bg-slate-700 border-slate-400'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                    style={{ width: NODE_RADIUS * 2, height: NODE_RADIUS * 2 }}
                  >
                    <Calendar size={10} className={
                      isEditing || isPinned ? 'text-white' : 'text-slate-400'
                    } />
                    
                    {isPinned && (
                      <div className="absolute -top-0.5 -right-0.5">
                        <Pin size={6} className="text-purple-300" />
                      </div>
                    )}
                  </div>

                  {/* Compact Date */}
                  <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
                    <div className="text-xs text-slate-400 font-medium">
                      {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </motion.div>

                {renderFloatingCards(entry, index)}
              </React.Fragment>
            );
          })}
        </AnimatePresence>

        {/* Simple Empty State */}
        {entries.length === 0 && (
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