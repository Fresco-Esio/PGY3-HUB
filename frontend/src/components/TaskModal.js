// Simplified Task Modal with just two cards - ultra clean design
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckSquare, 
  Clock, 
  Calendar, 
  Edit3,
  Save,
  Loader2
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
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);

  const statusOptions = [
    { value: 'to_do', label: 'To Do', color: 'text-gray-400' },
    { value: 'in_progress', label: 'In Progress', color: 'text-blue-400' },
    { value: 'done', label: 'Done', color: 'text-green-400' }
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
      setEditingTitle(false);
      setEditingDescription(false);
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
      
      addToast('Task updated successfully', 'success');
    } catch (error) {
      console.error('Error saving task:', error);
      addToast('Failed to save task', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [editData, data?.id, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

  const handleTitleSave = (value) => {
    saveField('title', value);
    setEditingTitle(false);
  };

  const handleDescriptionSave = (value) => {
    saveField('description', value);
    setEditingDescription(false);
  };

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
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
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
                <h2 className="text-xl font-semibold">Task</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>

            {/* Content Area - Just Two Cards */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 space-y-6">
              
              {/* Card 1: Task Details */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 space-y-4"
              >
                {/* Title */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-300">Title</label>
                    {!editingTitle && (
                      <button
                        onClick={() => setEditingTitle(true)}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                  
                  {editingTitle ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editData.title || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave(e.target.value);
                          if (e.key === 'Escape') setEditingTitle(false);
                        }}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter task title..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingTitle(false)}
                          className="px-3 py-1 text-slate-300 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleTitleSave(editData.title)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Save size={12} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingTitle(true)}
                      className="text-white bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    >
                      {editData.title || <span className="text-slate-400 italic">Click to add title...</span>}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-300">Description</label>
                    {!editingDescription && (
                      <button
                        onClick={() => setEditingDescription(true)}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                  </div>
                  
                  {editingDescription ? (
                    <div className="space-y-3">
                      <textarea
                        value={editData.description || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditingDescription(false);
                        }}
                        rows={3}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Enter task description..."
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingDescription(false)}
                          className="px-3 py-1 text-slate-300 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDescriptionSave(editData.description)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Save size={12} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setEditingDescription(true)}
                      className="text-white bg-slate-700/50 rounded-lg p-3 cursor-pointer hover:bg-slate-700/70 transition-colors min-h-[80px]"
                    >
                      {editData.description || <span className="text-slate-400 italic">Click to add description...</span>}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Card 2: Due Date and Status */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
              >
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      <Calendar size={16} className="inline mr-2 text-blue-400" />
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={editData.due_date ? new Date(editData.due_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => saveField('due_date', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Status - Freely Editable Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      <Clock size={16} className="inline mr-2 text-blue-400" />
                      Status
                    </label>
                    <select
                      value={editData.status || 'to_do'}
                      onChange={(e) => saveField('status', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
              </motion.div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;