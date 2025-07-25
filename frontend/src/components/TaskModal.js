// Simplified Task Modal with clean dark theme and editable fields
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckSquare, 
  Clock, 
  Calendar, 
  Link2,
  Edit3,
  Save,
  Loader2,
  Users,
  BookOpen,
  Brain,
  Check,
  AlertCircle
} from 'lucide-react';

// Animation variants for Framer Motion
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    y: 50,
    rotate: -5,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotate: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300,
      duration: 0.6,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    y: 30,
    rotate: -3,
    transition: {
      type: "easeInOut",
      duration: 0.4,
    }
  }
};

const backdropVariants = {
  hidden: { 
    opacity: 0,
    backdropFilter: 'blur(0px)'
  },
  visible: { 
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

const contentVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "easeOut",
      duration: 0.3,
      delay: 0.1,
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 1.02,
    transition: {
      type: "easeIn",
      duration: 0.2,
    }
  }
};

// Card animation variants for editable sections
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  edit: { 
    scale: 1.02,
    boxShadow: "0 8px 25px rgba(59, 130, 246, 0.15)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  saved: {
    scale: 1,
    boxShadow: "0 4px 15px rgba(34, 197, 94, 0.15)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Reusable EditableField Component
const EditableField = ({ 
  label, 
  value, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  isLoading,
  type = 'text',
  placeholder,
  rows = 1,
  icon: Icon,
  children // For custom edit content like dropdowns
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(localValue);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      animate={isEditing ? "edit" : "visible"}
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {Icon && <Icon size={20} className="text-blue-400" />}
          {label}
        </h3>
        {!isEditing && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onEdit}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            title={`Edit ${label.toLowerCase()}`}
          >
            <Edit3 size={16} />
          </motion.button>
        )}
      </div>
      
      {isEditing ? (
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children || (
            type === 'textarea' ? (
              <textarea
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                rows={rows}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder={placeholder}
                autoFocus
              />
            ) : (
              <input
                type={type}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSave}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={placeholder}
                autoFocus
              />
            )
          )}
          
          {type !== 'auto-save' && (
            <div className="flex justify-end gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isLoading}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </motion.button>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div 
          className="text-slate-300 leading-relaxed cursor-pointer hover:bg-slate-700/20 rounded-lg p-4 transition-colors"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={onEdit}
        >
          {value || <span className="text-slate-500 italic">Click to add {label.toLowerCase()}...</span>}
        </motion.div>
      )}
    </motion.div>
  );
};

// Reusable LinkedNodeList Component
const LinkedNodeList = ({ nodes = [], type = 'general' }) => {
  const getNodeIcon = (nodeType) => {
    switch (nodeType) {
      case 'case': return Users;
      case 'literature': return BookOpen;
      case 'topic': return Brain;
      default: return Link2;
    }
  };

  const getNodeColor = (nodeType) => {
    switch (nodeType) {
      case 'case': return 'text-green-400';
      case 'literature': return 'text-purple-400';
      case 'topic': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Link2 size={20} className="text-cyan-400" />
        Linked Nodes
      </h3>
      
      {nodes && nodes.length > 0 ? (
        <div className="space-y-3">
          {nodes.map((node, index) => {
            const IconComponent = getNodeIcon(node.type);
            const colorClass = getNodeColor(node.type);
            
            return (
              <motion.div
                key={node.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors"
              >
                <IconComponent size={16} className={colorClass} />
                <div className="flex-1">
                  <div className="text-white font-medium">{node.title || node.name}</div>
                  <div className="text-slate-400 text-sm capitalize">{node.type} node</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Link2 size={48} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-500 italic">No linked nodes yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Connected nodes will appear here automatically
          </p>
        </div>
      )}
    </motion.div>
  );
};

const TaskModal = ({ 
  isOpen, 
  data, 
  onClose,
  onAnimationStart,
  onAnimationEnd,
  setMindMapData,
  autoSaveMindMapData,
  addToast
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Individual field edit states
  const [editingFields, setEditingFields] = useState({});

  const statusOptions = [
    { value: 'to_do', label: 'To Do', color: 'text-gray-400', icon: Clock },
    { value: 'in_progress', label: 'In Progress', color: 'text-blue-400', icon: Clock },
    { value: 'done', label: 'Done', color: 'text-green-400', icon: CheckSquare }
  ];

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      const initialData = { 
        ...data,
        title: data.title || '',
        description: data.description || '',
        due_date: data.due_date || '',
        status: data.status || 'to_do',
        last_updated: data.last_updated || new Date().toISOString()
      };
      setEditData(initialData);
      setHasInitialized(true);
      setIsAnimating(true);
      if (onAnimationStart) onAnimationStart();
      
      setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 600);
    } else if (!isOpen && hasInitialized) {
      setHasInitialized(false);
      setEditingFields({});
    }
  }, [isOpen, data, hasInitialized, onAnimationStart, onAnimationEnd]);

  // Enhanced effect for instant feedback
  useEffect(() => {
    if (isOpen && data && hasInitialized) {
      setEditData(prevEditData => {
        const updatedData = { 
          ...prevEditData,
          ...data,
        };
        return updatedData;
      });
    }
  }, [data, isOpen, hasInitialized]);

  const handleClose = useCallback(() => {
    if (isAnimating || isClosing) return;
    
    setIsAnimating(true);
    setIsClosing(true);
    if (onAnimationStart) onAnimationStart();
    
    setIsVisible(false);
  }, [onAnimationStart, isAnimating, isClosing]);

  const startEditing = useCallback((field) => {
    setEditingFields(prev => ({ ...prev, [field]: true }));
  }, []);

  const cancelEditing = useCallback((field) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
  }, []);

  const saveField = useCallback(async (field, value) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const updatedData = {
        ...editData,
        [field]: value,
        last_updated: new Date().toISOString()
      };
      
      setEditData(updatedData);
      
      setMindMapData(prevData => {
        const updatedTasks = prevData.tasks.map(task =>
          String(task.id) === String(data?.id) ? { ...task, ...updatedData } : task
        );
        const newData = { ...prevData, tasks: updatedTasks };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      setEditingFields(prev => ({ ...prev, [field]: false }));
      addToast('Task updated successfully', 'success');
    } catch (error) {
      console.error('Error saving task:', error);
      addToast('Failed to save task', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [editData, data?.id, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

  // Get connected nodes for linking display
  const linkedNodes = useMemo(() => {
    if (!data?.id) return [];
    
    // This would typically come from your mind map connections data
    // For now, return empty array - implement based on your data structure
    return [];
  }, [data?.id]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => {
      setIsAnimating(false);
      setIsClosing(false);
      setHasInitialized(false);
      onClose();
      if (onAnimationEnd) onAnimationEnd();
    }}>
      {isVisible && (
        <motion.div
          key={`task-modal-${data?.id || 'default'}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          className="fixed inset-0 bg-black flex items-center justify-center z-50"
          style={{ 
            willChange: 'backdrop-filter, opacity',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)'
          }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[85vh] overflow-hidden"
            style={{ 
              willChange: 'transform, opacity, scale',
              backfaceVisibility: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
            onAnimationStart={() => {
              setIsAnimating(true);
              if (onAnimationStart) onAnimationStart();
            }}
            onAnimationComplete={() => {
              setIsAnimating(false);
              if (onAnimationEnd) onAnimationEnd();
            }}
          >
            {/* Modal Header */}
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckSquare size={24} />
                <h2 className="text-xl font-semibold">Task Details</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>

            {/* Content Area */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 overflow-y-auto max-h-[calc(85vh-80px)] p-6 space-y-6">
              
              {/* Task Title */}
              <EditableField
                label="Task Title"
                value={editData.title || ''}
                isEditing={editingFields.title}
                onEdit={() => startEditing('title')}
                onSave={(value) => saveField('title', value)}
                onCancel={() => cancelEditing('title')}
                isLoading={isLoading}
                type="text"
                placeholder="Enter task title..."
                icon={CheckSquare}
              />

              {/* Task Description */}
              <EditableField
                label="Description"
                value={editData.description || ''}
                isEditing={editingFields.description}
                onEdit={() => startEditing('description')}
                onSave={(value) => saveField('description', value)}
                onCancel={() => cancelEditing('description')}
                isLoading={isLoading}
                type="textarea"
                rows={4}
                placeholder="Enter task description..."
                icon={Edit3}
              />

              {/* Due Date and Status Row */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Due Date */}
                <EditableField
                  label="Due Date"
                  value={editData.due_date ? new Date(editData.due_date).toLocaleDateString() : ''}
                  isEditing={editingFields.due_date}
                  onEdit={() => startEditing('due_date')}
                  onSave={(value) => saveField('due_date', value)}
                  onCancel={() => cancelEditing('due_date')}
                  isLoading={isLoading}
                  type="auto-save"
                  icon={Calendar}
                >
                  <input
                    type="date"
                    value={editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => saveField('due_date', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </EditableField>

                {/* Task Status */}
                <EditableField
                  label="Status"
                  value={statusOptions.find(opt => opt.value === editData.status)?.label || 'To Do'}
                  isEditing={editingFields.status}
                  onEdit={() => startEditing('status')}
                  onSave={(value) => saveField('status', value)}
                  onCancel={() => cancelEditing('status')}
                  isLoading={isLoading}
                  type="auto-save"
                  icon={Clock}
                >
                  <select
                    value={editData.status || 'to_do'}
                    onChange={(e) => saveField('status', e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </EditableField>

              </div>

              {/* Linked Nodes */}
              <LinkedNodeList nodes={linkedNodes} />

              {/* Last Updated */}
              <div className="text-xs text-slate-500 text-right">
                Last updated: {editData.last_updated ? new Date(editData.last_updated).toLocaleString() : 'Never'}
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;