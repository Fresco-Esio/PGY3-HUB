// Enhanced Topic Modal with tabbed interface and advanced animations
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Brain, 
  Target, 
  Award, 
  Clock, 
  Sparkles, 
  Link2,
  Edit3,
  Trash2,
  Save,
  Loader2,
  Star,
  Plus,
  Check,
  RotateCcw,
  TrendingUp,
  Lightbulb,
  FileText,
  Layers
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
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.4 }
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

const TopicModal = ({ 
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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [newResource, setNewResource] = useState('');
  const [showResourceForm, setShowResourceForm] = useState(false);

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      setEditData({ 
        ...data,
        resources: data.resources || [],
        flashcard_count: data.flashcard_count || 0,
        completed_flashcards: data.completed_flashcards || 0
      });
      setHasInitialized(true);
      setIsAnimating(true);
      if (onAnimationStart) onAnimationStart();
      
      setTimeout(() => {
        setIsAnimating(false);
        if (onAnimationEnd) onAnimationEnd();
      }, 600);
    } else if (!isOpen && hasInitialized) {
      setHasInitialized(false);
    }
  }, [isOpen, hasInitialized, onAnimationStart, onAnimationEnd]);

  // Separate effect for data updates when modal is already open
  useEffect(() => {
    if (isOpen && data && hasInitialized && !isEditing && !isLoading && !isTabTransitioning && !isAnimating) {
      setEditData({ 
        ...data,
        resources: data.resources || [],
        flashcard_count: data.flashcard_count || 0,
        completed_flashcards: data.completed_flashcards || 0
      });
    }
  }, [data?.id, isOpen, hasInitialized, isEditing, isLoading, isTabTransitioning, isAnimating]);

  const progressPercentage = useMemo(() => {
    const total = editData.flashcard_count || 0;
    const completed = editData.completed_flashcards || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [editData.flashcard_count, editData.completed_flashcards]);

  const handleClose = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsClosing(true);
    if (onAnimationStart) onAnimationStart();
    
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setIsAnimating(false);
      setHasInitialized(false);
      onClose();
      if (onAnimationEnd) onAnimationEnd();
    }, 400);
  }, [onClose, isAnimating, onAnimationStart, onAnimationEnd]);

  const handleSave = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      setMindMapData(prevData => {
        const updatedTopics = prevData.topics.map(topic =>
          String(topic.id) === String(data?.id) ? { ...topic, ...editData } : topic
        );
        const newData = { ...prevData, topics: updatedTopics };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      setIsEditing(false);
      addToast('Topic updated successfully', 'success');
    } catch (error) {
      console.error('Error saving topic:', error);
      addToast('Failed to save topic', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [data?.id, editData, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

  const handleDelete = useCallback(async () => {
    if (isLoading) return;
    
    if (!window.confirm('Are you sure you want to delete this topic?')) return;
    
    setIsLoading(true);
    try {
      setMindMapData(prevData => {
        const updatedTopics = prevData.topics.filter(topic => String(topic.id) !== String(data?.id));
        const newData = { ...prevData, topics: updatedTopics };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      addToast('Topic deleted successfully', 'success');
      handleClose();
    } catch (error) {
      console.error('Error deleting topic:', error);
      addToast('Failed to delete topic', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [data?.id, setMindMapData, autoSaveMindMapData, addToast, handleClose, isLoading]);

  const updateField = useCallback((field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const addResource = useCallback(() => {
    if (!newResource.trim()) return;
    
    const updatedResources = [...(editData.resources || []), newResource.trim()];
    updateField('resources', updatedResources);
    setNewResource('');
    setShowResourceForm(false);
  }, [newResource, editData.resources, updateField]);

  const removeResource = useCallback((index) => {
    const updatedResources = editData.resources.filter((_, i) => i !== index);
    updateField('resources', updatedResources);
  }, [editData.resources, updateField]);

  const renderField = (label, field, type = 'text', options = {}) => {
    const value = editData[field] || '';
    
    if (!isEditing) {
      if (type === 'textarea') {
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="p-3 bg-gray-50 rounded-lg border min-h-[2.5rem] text-gray-800">
              {value || <span className="text-gray-400 italic">Not specified</span>}
            </div>
          </div>
        );
      }
      
      if (type === 'select') {
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="p-3 bg-gray-50 rounded-lg border text-gray-800">
              {value || <span className="text-gray-400 italic">Not specified</span>}
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <div className="p-3 bg-gray-50 rounded-lg border text-gray-800">
            {value || <span className="text-gray-400 italic">Not specified</span>}
          </div>
        </div>
      );
    }

    // Editing mode
    if (type === 'textarea') {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <textarea
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            rows={options.rows || 3}
            placeholder={`Enter ${label.toLowerCase()}...`}
          />
        </div>
      );
    }

    if (type === 'select' && options.choices) {
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <select
            value={value}
            onChange={(e) => updateField(field, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {options.choices.map(choice => (
              <option key={choice} value={choice}>{choice}</option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
          type={type}
          value={value}
          onChange={(e) => updateField(field, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => setHasInitialized(false)}>
      {isVisible && (
        <motion.div
          key={`topic-modal-${data?.id || 'default'}`}
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
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={24} />
                <h2 className="text-xl font-semibold">Topic Details</h2>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && !isLoading && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all"
                      title="Edit"
                    >
                      <Edit3 size={20} />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-white hover:text-red-200 p-2 rounded-full hover:bg-red-500 hover:bg-opacity-30 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
                  </>
                )}
                <button onClick={handleClose} className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-all">
                  <X size={20} />
                </button>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600">
              <nav className="flex flex-wrap gap-2 px-6 py-4">
                {[
                  { key: 'overview', label: 'Overview', icon: BookOpen },
                  { key: 'progress', label: 'Progress', icon: TrendingUp },
                  { key: 'resources', label: 'Resources', icon: FileText },
                  { key: 'insights', label: 'Insights', icon: Lightbulb },
                  { key: 'connections', label: 'Connections', icon: Link2 }
                ].map(({ key, label, icon: Icon }) => (
                  <motion.button
                    key={key}
                    onClick={() => {
                      if (isTabTransitioning) return;
                      setIsTabTransitioning(true);
                      setActiveTab(key);
                      setTimeout(() => setIsTabTransitioning(false), 300);
                    }}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                      activeTab === key
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                    }`}
                    whileHover={{ scale: activeTab === key ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={false}
                    animate={{
                      scale: activeTab === key ? 1.05 : 1,
                      boxShadow: activeTab === key 
                        ? '0 8px 25px rgba(147, 51, 234, 0.3), 0 0 20px rgba(99, 102, 241, 0.2)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Icon size={16} className={activeTab === key ? 'drop-shadow-sm' : ''} />
                    {label}
                    
                    {activeTab === key && (
                      <motion.div
                        layoutId="topicTabGlow"
                        className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-500/20 rounded-xl blur-sm"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>
            
            {/* Tab Content */}
            <motion.div 
              className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
              layout="position"
              layoutRoot
              transition={{ 
                layout: { duration: 0.4, ease: "easeInOut" },
                height: { duration: 0.4, ease: "easeInOut" }
              }}
            >
              <AnimatePresence mode="wait" initial={false} onExitComplete={() => setIsTabTransitioning(false)}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
                  >
                    <div className="space-y-6">
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Brain size={20} className="text-purple-600" />
                          Topic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {renderField('Title', 'title')}
                          {renderField('Category', 'category', 'select', {
                            choices: [
                              'Mood Disorders',
                              'Anxiety Disorders', 
                              'Psychotic Disorders',
                              'Personality Disorders',
                              'Substance Use Disorders',
                              'Neurodevelopmental Disorders',
                              'Trauma-Related Disorders',
                              'Eating Disorders',
                              'Sleep Disorders',
                              'Neurocognitive Disorders',
                              'Other'
                            ]
                          })}
                        </div>
                        <div className="mt-6">
                          {renderField('Description', 'description', 'textarea', { rows: 4 })}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <Target size={20} className="text-green-600" />
                          Learning Progress
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {renderField('Total Flashcards', 'flashcard_count', 'number')}
                          {renderField('Completed Flashcards', 'completed_flashcards', 'number')}
                        </div>
                        
                        {/* Progress Visualization */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm text-gray-500">{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercentage}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Progress Tab */}
                {activeTab === 'progress' && (
                  <motion.div
                    key="progress"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-600" />
                        Learning Analytics
                      </h3>
                      
                      {/* Progress Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Check size={20} className="text-green-600" />
                            <span className="font-medium text-green-800">Completed</span>
                          </div>
                          <div className="text-2xl font-bold text-green-700">
                            {editData.completed_flashcards || 0}
                          </div>
                          <div className="text-sm text-green-600">flashcards mastered</div>
                        </motion.div>
                        
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Clock size={20} className="text-blue-600" />
                            <span className="font-medium text-blue-800">Remaining</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-700">
                            {Math.max(0, (editData.flashcard_count || 0) - (editData.completed_flashcards || 0))}
                          </div>
                          <div className="text-sm text-blue-600">flashcards to review</div>
                        </motion.div>
                        
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Award size={20} className="text-purple-600" />
                            <span className="font-medium text-purple-800">Progress</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-700">
                            {progressPercentage}%
                          </div>
                          <div className="text-sm text-purple-600">completion rate</div>
                        </motion.div>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-medium text-gray-800">Overall Progress</span>
                          <span className="text-sm text-gray-500">
                            {editData.completed_flashcards || 0} / {editData.flashcard_count || 0}
                          </span>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <motion.div
                              className="bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-600 h-4 rounded-full flex items-center justify-end pr-2"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercentage}%` }}
                              transition={{ duration: 1.2, ease: "easeOut" }}
                            >
                              {progressPercentage > 10 && (
                                <span className="text-xs font-bold text-white drop-shadow-sm">
                                  {progressPercentage}%
                                </span>
                              )}
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Resources Tab */}
                {activeTab === 'resources' && (
                  <motion.div
                    key="resources"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                          <FileText size={20} className="text-orange-600" />
                          Learning Resources
                        </h3>
                        {isEditing && (
                          <button
                            onClick={() => setShowResourceForm(!showResourceForm)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Plus size={16} />
                            Add Resource
                          </button>
                        )}
                      </div>
                      
                      {/* Add Resource Form */}
                      {isEditing && showResourceForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex gap-3">
                            <input
                              type="text"
                              value={newResource}
                              onChange={(e) => setNewResource(e.target.value)}
                              placeholder="Enter resource URL or description..."
                              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onKeyPress={(e) => e.key === 'Enter' && addResource()}
                            />
                            <button
                              onClick={addResource}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Resources List */}
                      <div className="space-y-3">
                        {editData.resources && editData.resources.length > 0 ? (
                          editData.resources.map((resource, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <span className="text-gray-700">{resource}</span>
                              {isEditing && (
                                <button
                                  onClick={() => removeResource(index)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>No resources added yet</p>
                            {isEditing && (
                              <p className="text-sm mt-1">Click "Add Resource" to get started</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Insights Tab */}
                {activeTab === 'insights' && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Lightbulb size={20} className="text-yellow-600" />
                        Learning Insights
                      </h3>
                      
                      {/* Insights Cards */}
                      <div className="space-y-4">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200"
                        >
                          <div className="flex items-start gap-3">
                            <Sparkles size={20} className="text-yellow-600 mt-1" />
                            <div>
                              <h4 className="font-medium text-yellow-800 mb-1">Study Recommendation</h4>
                              <p className="text-yellow-700 text-sm">
                                Based on your progress, consider reviewing foundational concepts before advancing to complex topics.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-start gap-3">
                            <Brain size={20} className="text-blue-600 mt-1" />
                            <div>
                              <h4 className="font-medium text-blue-800 mb-1">Learning Pattern</h4>
                              <p className="text-blue-700 text-sm">
                                You tend to perform better with visual learning materials. Consider adding more diagrams and charts.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                        
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200"
                        >
                          <div className="flex items-start gap-3">
                            <Target size={20} className="text-green-600 mt-1" />
                            <div>
                              <h4 className="font-medium text-green-800 mb-1">Next Steps</h4>
                              <p className="text-green-700 text-sm">
                                Focus on completing the remaining flashcards to solidify your understanding of this topic.
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Connections Tab */}
                {activeTab === 'connections' && (
                  <motion.div
                    key="connections"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                        <Link2 size={20} className="text-indigo-600" />
                        Related Content
                      </h3>
                      
                      <div className="text-center py-8 text-gray-500">
                        <Layers size={48} className="mx-auto mb-3 text-gray-300" />
                        <p>No connections found</p>
                        <p className="text-sm mt-1">Create connections by linking this topic to cases, tasks, or literature</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {isEditing && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Changes will be auto-saved
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData({ ...data });
                      setShowResourceForm(false);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(TopicModal, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.data?.updated_at === nextProps.data?.updated_at
  );
});
