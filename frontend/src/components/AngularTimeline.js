// Angular Timeline Component for Case Modal
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

  // Calculate node positioning (alternating left/right)
  const getNodePosition = useCallback((index) => {
    return index % 2 === 0 ? 'left' : 'right';
  }, []);

  // Get connection corner based on position and card type
  const getConnectionCorner = useCallback((position, cardType) => {
    if (position === 'left') {
      return cardType === 'patient' ? 'bottom-right' : 'top-left';
    } else {
      return cardType === 'patient' ? 'bottom-left' : 'top-right';
    }
  }, []);

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
      orderIndex: entries.length
    };
    
    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    setEditingEntryId(newEntry.id);
    
    if (onUpdateTimeline) {
      onUpdateTimeline(updatedEntries);
    }
    
    // Scroll to bottom to show new entry
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
      orderIndex: afterIndex + 0.5
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

  // Render floating cards
  const renderFloatingCards = useCallback((entry, position) => {
    if (hoveredEntryId !== entry.id && editingEntryId !== entry.id) return null;

    const isEditing = editingEntryId === entry.id;
    const patientCorner = getConnectionCorner(position, 'patient');
    const clinicalCorner = getConnectionCorner(position, 'clinical');

    return (
      <AnimatePresence>
        <motion.div
          key={`cards-${entry.id}`}
          className="absolute z-50 pointer-events-none"
          style={{
            left: position === 'left' ? '-400px' : '60px',
            top: '-100px',
            width: '380px'
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
            className={`mb-4 bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-xl pointer-events-auto relative ${
              isEditing ? 'ring-2 ring-blue-500' : ''
            }`}
            variants={cardVariants}
            whileHover={!isEditing ? "hover" : undefined}
            style={{
              marginLeft: position === 'left' ? '0' : '180px'
            }}
          >
            {/* Connection line to node */}
            <div
              className={`absolute w-2 h-2 bg-blue-400 ${
                patientCorner === 'bottom-right' ? 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' :
                patientCorner === 'bottom-left' ? 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' :
                patientCorner === 'top-left' ? 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' :
                'top-0 right-0 translate-x-1/2 -translate-y-1/2'
              }`}
            />
            
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
            className={`bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-xl p-4 shadow-xl pointer-events-auto relative ${
              isEditing ? 'ring-2 ring-purple-500' : ''
            }`}
            variants={cardVariants}
            whileHover={!isEditing ? "hover" : undefined}
            style={{
              marginLeft: position === 'left' ? '180px' : '0'
            }}
          >
            {/* Connection line to node */}
            <div
              className={`absolute w-2 h-2 bg-purple-400 ${
                clinicalCorner === 'bottom-right' ? 'bottom-0 right-0 translate-x-1/2 translate-y-1/2' :
                clinicalCorner === 'bottom-left' ? 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2' :
                clinicalCorner === 'top-left' ? 'top-0 left-0 -translate-x-1/2 -translate-y-1/2' :
                'top-0 right-0 translate-x-1/2 -translate-y-1/2'
              }`}
            />
            
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
              className="flex justify-end gap-2 mt-3 pointer-events-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setEditingEntryId(null)}
                className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => saveEntry(entry.id)}
                disabled={isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  }, [hoveredEntryId, editingEntryId, getConnectionCorner, updateEntry, saveEntry, isLoading]);

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
      <div className="relative min-h-[400px]">
        {/* Central Timeline Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-600 transform -translate-x-1/2" />

        {/* Timeline Entries */}
        <AnimatePresence>
          {entries.map((entry, index) => {
            const position = getNodePosition(index);
            const isDragging = draggedEntry?.id === entry.id;
            const isDragOver = dragOverIndex === index;

            return (
              <div key={entry.id}>
                {/* Connector with double-click insert */}
                {index > 0 && (
                  <motion.div
                    className="absolute left-1/2 w-0.5 h-16 cursor-pointer transform -translate-x-1/2"
                    style={{ top: `${index * 200 - 16}px` }}
                    variants={connectorVariants}
                    animate={hoveredConnectorIndex === index ? "hover" : "inactive"}
                    onMouseEnter={() => setHoveredConnectorIndex(index)}
                    onMouseLeave={() => setHoveredConnectorIndex(null)}
                    onDoubleClick={() => insertEntry(index - 1)}
                  >
                    <div className="w-full h-full bg-gradient-to-b from-slate-600 to-blue-500" />
                    {hoveredConnectorIndex === index && (
                      <motion.div
                        className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <Plus size={12} className="text-white" />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {/* Timeline Node */}
                <motion.div
                  className={`absolute ${position === 'left' ? 'right-1/2 mr-8' : 'left-1/2 ml-8'} transform ${
                    isDragging ? 'opacity-50' : ''
                  } ${isDragOver ? 'scale-105' : ''}`}
                  style={{ top: `${index * 200}px` }}
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
                    className={`relative w-16 h-16 rounded-full border-4 cursor-pointer flex items-center justify-center ${
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
                    <Calendar size={20} className={
                      editingEntryId === entry.id ? 'text-white' : 'text-slate-400'
                    } />
                    
                    {/* Drag Handle */}
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical size={12} className="text-slate-400" />
                    </div>
                  </motion.div>

                  {/* Date Label */}
                  <div className={`absolute top-20 ${position === 'left' ? 'right-0' : 'left-0'} text-center`}>
                    <div className="text-xs text-slate-400 font-medium">
                      {new Date(entry.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Floating Cards */}
                  {renderFloatingCards(entry, position)}
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