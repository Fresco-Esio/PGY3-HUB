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
  Layers,
  Stethoscope,
  Pill,
  Users,
  Tag,
  Calendar,
  Activity,
  ChevronDown,
  ChevronRight
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

// Card animation variants for sections
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
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  
  // Individual section edit states
  const [editingSections, setEditingSections] = useState({});
  const [sectionData, setSectionData] = useState({});
  
  // Tab-specific scroll positions
  const [scrollPositions, setScrollPositions] = useState({});
  const contentRefs = useRef({});
  
  // Form states for different tabs
  const [expandedCriteria, setExpandedCriteria] = useState(false);
  const [newTags, setNewTags] = useState({}); // For managing new tag inputs
  const [newResource, setNewResource] = useState('');
  const [showResourceForm, setShowResourceForm] = useState(false);

  // Category color mapping
  const categoryColors = {
    'Mood Disorders': { primary: '#ef4444', secondary: '#fca5a5' }, // red
    'Anxiety Disorders': { primary: '#f59e0b', secondary: '#fbbf24' }, // amber
    'Psychotic Disorders': { primary: '#8b5cf6', secondary: '#c4b5fd' }, // violet
    'Personality Disorders': { primary: '#10b981', secondary: '#6ee7b7' }, // emerald
    'Neurodevelopmental Disorders': { primary: '#3b82f6', secondary: '#93c5fd' }, // blue
    'Trauma Related Disorders': { primary: '#dc2626', secondary: '#f87171' }, // red-600
    'Substance Use Disorders': { primary: '#059669', secondary: '#34d399' }, // emerald-600
    'Eating Disorders': { primary: '#d946ef', secondary: '#e879f9' }, // fuchsia
    'Sleep Disorders': { primary: '#6366f1', secondary: '#a5b4fc' }, // indigo
    'Cognitive Disorders': { primary: '#ea580c', secondary: '#fb923c' }, // orange-600
    'Other': { primary: '#6b7280', secondary: '#9ca3af' } // gray
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    { id: 'concept', label: 'Concept', icon: Brain },
    { id: 'clinical', label: 'Clinical Associations', icon: Stethoscope },
    { id: 'treatment', label: 'Treatment', icon: Pill },
    { id: 'connections', label: 'Connections', icon: Link2 }
  ];

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      const initialData = { 
        ...data,
        category: data.category || 'Other',
        definition: data.definition || '',
        diagnostic_criteria: data.diagnostic_criteria || [],
        comorbidities: data.comorbidities || [],
        differential_diagnoses: data.differential_diagnoses || [],
        medications: data.medications || [],
        psychotherapy_modalities: data.psychotherapy_modalities || [],
        flashcard_count: data.flashcard_count || 0,
        completed_flashcards: data.completed_flashcards || 0,
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
      setScrollPositions({});
      setEditingSections({});
      setSectionData({});
    }
  }, [isOpen, data, hasInitialized, onAnimationStart, onAnimationEnd]);

  // Enhanced effect for instant feedback - updates editData immediately when data changes
  useEffect(() => {
    if (isOpen && data && hasInitialized) {
      // Update editData with latest data for instant feedback
      setEditData(prevEditData => {
        const updatedData = { 
          ...prevEditData, // Keep any local edits
          ...data, // Override with latest data from parent
          category: data.category || prevEditData.category || 'Other',
          definition: data.definition || prevEditData.definition || '',
          diagnostic_criteria: data.diagnostic_criteria || prevEditData.diagnostic_criteria || [],
          comorbidities: data.comorbidities || prevEditData.comorbidities || [],
          differential_diagnoses: data.differential_diagnoses || prevEditData.differential_diagnoses || [],
          medications: data.medications || prevEditData.medications || [],
          psychotherapy_modalities: data.psychotherapy_modalities || prevEditData.psychotherapy_modalities || [],
          flashcard_count: data.flashcard_count || prevEditData.flashcard_count || 0,
          completed_flashcards: data.completed_flashcards || prevEditData.completed_flashcards || 0,
          last_updated: data.last_updated || prevEditData.last_updated || new Date().toISOString()
        };
        return updatedData;
      });
    }
  }, [data, isOpen, hasInitialized]);

  const progressPercentage = useMemo(() => {
    const total = editData.flashcard_count || 0;
    const completed = editData.completed_flashcards || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [editData.flashcard_count, editData.completed_flashcards]);

  const handleClose = useCallback(() => {
    if (isAnimating || isClosing) return;
    
    setIsAnimating(true);
    setIsClosing(true);
    if (onAnimationStart) onAnimationStart();
    
    // Set visibility to false to trigger exit animation
    setIsVisible(false);
  }, [onAnimationStart, isAnimating, isClosing]);

  const handleSave = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const updatedData = {
        ...editData,
        last_updated: new Date().toISOString()
      };
      
      setMindMapData(prevData => {
        const updatedTopics = prevData.topics.map(topic =>
          String(topic.id) === String(data?.id) ? { ...topic, ...updatedData } : topic
        );
        const newData = { ...prevData, topics: updatedTopics };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      setEditData(updatedData);
      addToast('Topic updated successfully', 'success');
    } catch (error) {
      console.error('Error saving topic:', error);
      addToast('Failed to save topic', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [data?.id, editData, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

  // Save current tab's scroll position before switching
  const saveScrollPosition = useCallback((tabId) => {
    const contentRef = contentRefs.current[tabId];
    if (contentRef) {
      setScrollPositions(prev => ({
        ...prev,
        [tabId]: contentRef.scrollTop
      }));
    }
  }, []);

  // Restore scroll position when switching to a tab
  const restoreScrollPosition = useCallback((tabId) => {
    setTimeout(() => {
      const contentRef = contentRefs.current[tabId];
      const savedPosition = scrollPositions[tabId];
      if (contentRef && savedPosition) {
        contentRef.scrollTop = savedPosition;
      }
    }, 100); // Small delay to ensure content is rendered
  }, [scrollPositions]);

  // Handle tab switching with scroll position preservation
  const handleTabSwitch = useCallback((newTabId) => {
    if (newTabId === activeTab || isTabTransitioning) return;
    
    // Save current tab's scroll position
    saveScrollPosition(activeTab);
    
    setIsTabTransitioning(true);
    setActiveTab(newTabId);
    
    setTimeout(() => {
      setIsTabTransitioning(false);
      // Restore new tab's scroll position
      restoreScrollPosition(newTabId);
    }, 300);
  }, [activeTab, isTabTransitioning, saveScrollPosition, restoreScrollPosition]);

  // Enhanced category change handler - fixes node color updates and category saving
  const handleCategoryChange = useCallback(async (newCategory) => {
    console.log('Category changing to:', newCategory);
    
    // Get the new color for immediate update
    const newColor = categoryColors[newCategory]?.primary || categoryColors.Other.primary;
    console.log('New color for category:', newColor);
    
    // Update local edit data for immediate UI feedback
    const updatedEditData = { ...editData, category: newCategory, color: newColor, last_updated: new Date().toISOString() };
    setEditData(updatedEditData);
    
    // Update node color in mind map immediately and save
    setMindMapData(prevData => {
      const updatedTopics = prevData.topics.map(topic =>
        String(topic.id) === String(data?.id) 
          ? { ...topic, category: newCategory, color: newColor, last_updated: new Date().toISOString() }
          : topic
      );
      const newData = { ...prevData, topics: updatedTopics };
      
      // Auto-save the changes to backend immediately
      console.log('Saving category change to backend:', newCategory, newColor);
      autoSaveMindMapData(newData);
      
      return newData;
    });
    
    addToast(`Category updated to ${newCategory}`, 'success');
  }, [data?.id, editData, setMindMapData, categoryColors, autoSaveMindMapData, addToast]);

  // Get connected nodes for Connections tab
  const connectedNodes = useMemo(() => {
    if (!data?.id) return { cases: [], literature: [] };
    
    // This would typically come from your mind map data
    // For now, return empty arrays - you can implement based on your data structure
    return {
      cases: [],
      literature: []
    };
  }, [data?.id]);

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

  // Individual section edit functions
  const startEditingSection = useCallback((sectionId) => {
    setEditingSections(prev => ({ ...prev, [sectionId]: true }));
    // Initialize section data with current values
    setSectionData(prev => ({
      ...prev,
      [sectionId]: { ...editData }
    }));
  }, [editData]);

  const cancelEditingSection = useCallback((sectionId) => {
    setEditingSections(prev => ({ ...prev, [sectionId]: false }));
    setSectionData(prev => {
      const newData = { ...prev };
      delete newData[sectionId];
      return newData;
    });
  }, []);

  const saveSectionEdit = useCallback(async (sectionId) => {
    if (isLoading) return;
    
    const sectionChanges = sectionData[sectionId];
    if (!sectionChanges) return;
    
    setIsLoading(true);
    try {
      const updatedData = {
        ...editData,
        ...sectionChanges,
        last_updated: new Date().toISOString()
      };
      
      // Update editData immediately for instant feedback
      setEditData(updatedData);
      
      setMindMapData(prevData => {
        const updatedTopics = prevData.topics.map(topic =>
          String(topic.id) === String(data?.id) ? { ...topic, ...updatedData } : topic
        );
        const newData = { ...prevData, topics: updatedTopics };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      setEditingSections(prev => ({ ...prev, [sectionId]: false }));
      setSectionData(prev => {
        const newData = { ...prev };
        delete newData[sectionId];
        return newData;
      });
      
      addToast('Section updated successfully', 'success');
    } catch (error) {
      console.error('Error saving section:', error);
      addToast('Failed to save section', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [sectionData, editData, data?.id, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

  const updateSectionField = useCallback((sectionId, field, value) => {
    setSectionData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  }, []);

  // Tag management functions for list-based sections
  const addTagToSection = useCallback((sectionId, field, tag) => {
    if (!tag.trim()) return;
    
    const currentTags = sectionData[sectionId]?.[field] || editData[field] || [];
    if (!currentTags.includes(tag.trim())) {
      updateSectionField(sectionId, field, [...currentTags, tag.trim()]);
    }
  }, [sectionData, editData, updateSectionField]);

  const removeTagFromSection = useCallback((sectionId, field, tagToRemove) => {
    const currentTags = sectionData[sectionId]?.[field] || editData[field] || [];
    updateSectionField(sectionId, field, currentTags.filter(tag => tag !== tagToRemove));
  }, [sectionData, editData, updateSectionField]);

  // Helper functions for new tag input management
  const setNewTag = useCallback((sectionId, value) => {
    setNewTags(prev => ({ ...prev, [sectionId]: value }));
  }, []);

  const getNewTag = useCallback((sectionId) => {
    return newTags[sectionId] || '';
  }, [newTags]);

  const clearNewTag = useCallback((sectionId) => {
    setNewTags(prev => {
      const newTags = { ...prev };
      delete newTags[sectionId];
      return newTags;
    });
  }, []);

  // Enhanced direct list management functions
  const addItemDirectly = useCallback((field, item) => {
    if (!item.trim()) return;
    
    const currentItems = editData[field] || [];
    if (!currentItems.includes(item.trim())) {
      const updatedItems = [...currentItems, item.trim()];
      const updatedData = { 
        ...editData, 
        [field]: updatedItems, 
        last_updated: new Date().toISOString() 
      };
      
      // Update local state immediately
      setEditData(updatedData);
      
      // Update mind map data and save
      setMindMapData(prevData => {
        const updatedTopics = prevData.topics.map(topic =>
          String(topic.id) === String(data?.id) ? { ...topic, ...updatedData } : topic
        );
        const newData = { ...prevData, topics: updatedTopics };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      addToast(`${field} updated successfully`, 'success');
    }
  }, [editData, data?.id, setMindMapData, autoSaveMindMapData, addToast]);

  const removeItemDirectly = useCallback((field, itemToRemove) => {
    const currentItems = editData[field] || [];
    const updatedItems = currentItems.filter(item => item !== itemToRemove);
    const updatedData = { 
      ...editData, 
      [field]: updatedItems, 
      last_updated: new Date().toISOString() 
    };
    
    // Update local state immediately
    setEditData(updatedData);
    
    // Update mind map data and save
    setMindMapData(prevData => {
      const updatedTopics = prevData.topics.map(topic =>
        String(topic.id) === String(data?.id) ? { ...topic, ...updatedData } : topic
      );
      const newData = { ...prevData, topics: updatedTopics };
      autoSaveMindMapData(newData);
      return newData;
    });
    
    addToast(`${field} updated successfully`, 'success');
  }, [editData, data?.id, setMindMapData, autoSaveMindMapData, addToast]);

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
          key={`topic-modal-${data?.id || 'default'}`}
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
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[85vh] overflow-hidden"
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
            <motion.div 
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={24} />
                <h2 className="text-xl font-semibold">Topic Details</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </motion.div>

            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600">
              <nav className="flex flex-wrap gap-2 px-6 py-4">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <motion.button
                    key={id}
                    onClick={() => handleTabSwitch(id)}
                    className={`relative flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                      activeTab === id
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                    }`}
                    whileHover={{ scale: activeTab === id ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isTabTransitioning}
                  >
                    <Icon size={16} className={activeTab === id ? 'drop-shadow-sm' : ''} />
                    {label}
                    
                    {activeTab === id && (
                      <motion.div
                        layoutId="topicActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-500/20 rounded-xl blur-sm"
                        initial={false}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Dark Content Area */}
            <motion.div
              className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden"
              animate={{ opacity: isTabTransitioning ? 0.7 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    ref={el => contentRefs.current.overview = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Title Section */}
                    <motion.div 
                      variants={cardVariants}
                      animate={editingSections.title ? "edit" : "visible"}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Title</h3>
                        {!editingSections.title && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEditingSection('title')}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                            title="Edit title"
                          >
                            <Edit3 size={16} />
                          </motion.button>
                        )}
                      </div>
                      
                      {editingSections.title ? (
                        <motion.div 
                          className="space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <input
                            type="text"
                            value={sectionData.title?.title || editData.title || ''}
                            onChange={(e) => updateSectionField('title', 'title', e.target.value)}
                            className="w-full text-xl font-bold bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            placeholder="Topic title..."
                          />
                          <div className="flex justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => cancelEditingSection('title')}
                              className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => saveSectionEdit('title')}
                              disabled={isLoading}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                            >
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              Save
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.h1 
                          className="text-2xl font-bold text-white"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                          {editData.title || 'Untitled Topic'}
                        </motion.h1>
                      )}
                    </motion.div>

                    {/* Category and Progress Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Category Selection - Direct Access (No Edit Button) */}
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                      >
                        <label className="block text-sm font-medium text-slate-300 mb-3">Category</label>
                        <motion.select
                          value={editData.category || 'Other'}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:bg-slate-650 transition-colors cursor-pointer"
                          whileFocus={{ scale: 1.02 }}
                        >
                          {Object.keys(categoryColors).map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </motion.select>
                        <p className="text-xs text-slate-400 mt-2">
                          Changes are saved automatically and will update the node color
                        </p>
                      </motion.div>

                      {/* Flashcard Progress */}
                      <motion.div 
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-slate-300">Flashcard Progress</span>
                          <span className="text-sm text-slate-400">
                            {editData.completed_flashcards || 0} / {editData.flashcard_count || 0}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-3 mb-2">
                          <motion.div
                            className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">{progressPercentage}%</span>
                          <span className="text-sm text-slate-400 ml-1">complete</span>
                        </div>
                      </motion.div>
                    </div>

                    {/* Last Updated */}
                    <div className="text-xs text-slate-500 text-right">
                      Last updated: {editData.last_updated ? new Date(editData.last_updated).toLocaleString() : 'Never'}
                    </div>
                  </motion.div>
                )}

                {/* Concept Tab */}
                {activeTab === 'concept' && (
                  <motion.div
                    key="concept"
                    ref={el => contentRefs.current.concept = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Definition Section */}
                    <motion.div 
                      variants={cardVariants}
                      animate={editingSections.definition ? "edit" : "visible"}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Brain size={20} className="text-purple-400" />
                          Definition
                        </h3>
                        {!editingSections.definition && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEditingSection('definition')}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                            title="Edit definition"
                          >
                            <Edit3 size={16} />
                          </motion.button>
                        )}
                      </div>
                      
                      {editingSections.definition ? (
                        <motion.div 
                          className="space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <textarea
                            value={sectionData.definition?.definition || editData.definition || ''}
                            onChange={(e) => updateSectionField('definition', 'definition', e.target.value)}
                            rows={4}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            placeholder="Enter the definition of this topic..."
                          />
                          <div className="flex justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => cancelEditingSection('definition')}
                              className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => saveSectionEdit('definition')}
                              disabled={isLoading}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                            >
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              Save
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="text-slate-300 leading-relaxed"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                        >
                          {editData.definition || <span className="text-slate-500 italic">No definition provided</span>}
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Diagnostic Criteria Section */}
                    <motion.div 
                      variants={cardVariants}
                      animate={editingSections.diagnostic_criteria ? "edit" : "visible"}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <FileText size={20} className="text-indigo-400" />
                          Diagnostic Criteria
                        </h3>
                        <div className="flex items-center gap-2">
                          {!editingSections.diagnostic_criteria && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => startEditingSection('diagnostic_criteria')}
                              className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                              title="Edit diagnostic criteria"
                            >
                              <Edit3 size={16} />
                            </motion.button>
                          )}
                          <button
                            onClick={() => setExpandedCriteria(!expandedCriteria)}
                            className="text-slate-400 hover:text-white transition-colors"
                          >
                            {expandedCriteria ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedCriteria && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            {editingSections.diagnostic_criteria ? (
                              <div className="space-y-4">
                                <textarea
                                  value={Array.isArray(sectionData.diagnostic_criteria?.diagnostic_criteria) 
                                    ? sectionData.diagnostic_criteria.diagnostic_criteria.join('\n') 
                                    : Array.isArray(editData.diagnostic_criteria) 
                                      ? editData.diagnostic_criteria.join('\n') 
                                      : editData.diagnostic_criteria || ''}
                                  onChange={(e) => updateSectionField('diagnostic_criteria', 'diagnostic_criteria', e.target.value.split('\n').filter(item => item.trim()))}
                                  rows={6}
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                                  placeholder="Enter diagnostic criteria (one per line)..."
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => cancelEditingSection('diagnostic_criteria')}
                                    className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                                  >
                                    Cancel
                                  </button>
                                  <motion.button
                                    onClick={() => saveSectionEdit('diagnostic_criteria')}
                                    disabled={isLoading}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                                  >
                                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Save
                                  </motion.button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {(editData.diagnostic_criteria || []).length > 0 ? (
                                  editData.diagnostic_criteria.map((criteria, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                      <span className="text-purple-400 font-medium">{index + 1}.</span>
                                      <span className="text-slate-300">{criteria}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-slate-500 italic">No diagnostic criteria provided</span>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>
                )}

                {/* Clinical Associations Tab */}
                {activeTab === 'clinical' && (
                  <motion.div
                    key="clinical"
                    ref={el => contentRefs.current.clinical = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Comorbidities Section */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Users size={20} className="text-amber-400" />
                        Comorbidities
                      </h3>
                      
                      {/* Current comorbidities list */}
                      <div className="space-y-2 mb-4">
                        <AnimatePresence>
                          {(editData.comorbidities || []).map((comorbidity, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center justify-between p-3 bg-amber-600/10 rounded-lg border border-amber-600/20 group hover:bg-amber-600/15 transition-colors"
                            >
                              <span className="text-amber-300">{comorbidity}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItemDirectly('comorbidities', comorbidity)}
                                className="text-amber-400 hover:text-amber-200 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                title="Remove comorbidity"
                              >
                                <X size={16} />
                              </motion.button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {/* Add new comorbidity */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getNewTag('comorbidities')}
                          onChange={(e) => setNewTag('comorbidities', e.target.value)}
                          placeholder="Add comorbidity..."
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && getNewTag('comorbidities').trim()) {
                              addItemDirectly('comorbidities', getNewTag('comorbidities'));
                              clearNewTag('comorbidities');
                            }
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (getNewTag('comorbidities').trim()) {
                              addItemDirectly('comorbidities', getNewTag('comorbidities'));
                              clearNewTag('comorbidities');
                            }
                          }}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add
                        </motion.button>
                      </div>
                      
                      {(editData.comorbidities || []).length === 0 && (
                        <p className="text-slate-500 italic text-center py-4">No comorbidities added yet</p>
                      )}
                    </motion.div>

                    {/* Differential Diagnoses Section */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-cyan-400" />
                        Differential Diagnoses
                      </h3>
                      
                      {/* Current differential diagnoses list */}
                      <div className="space-y-2 mb-4">
                        <AnimatePresence>
                          {(editData.differential_diagnoses || []).map((diagnosis, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center justify-between p-3 bg-cyan-600/10 rounded-lg border border-cyan-600/20 group hover:bg-cyan-600/15 transition-colors"
                            >
                              <span className="text-cyan-300">{diagnosis}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItemDirectly('differential_diagnoses', diagnosis)}
                                className="text-cyan-400 hover:text-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                title="Remove differential diagnosis"
                              >
                                <X size={16} />
                              </motion.button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {/* Add new differential diagnosis */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getNewTag('differential_diagnoses')}
                          onChange={(e) => setNewTag('differential_diagnoses', e.target.value)}
                          placeholder="Add differential diagnosis..."
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && getNewTag('differential_diagnoses').trim()) {
                              addItemDirectly('differential_diagnoses', getNewTag('differential_diagnoses'));
                              clearNewTag('differential_diagnoses');
                            }
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (getNewTag('differential_diagnoses').trim()) {
                              addItemDirectly('differential_diagnoses', getNewTag('differential_diagnoses'));
                              clearNewTag('differential_diagnoses');
                            }
                          }}
                          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add
                        </motion.button>
                      </div>
                      
                      {(editData.differential_diagnoses || []).length === 0 && (
                        <p className="text-slate-500 italic text-center py-4">No differential diagnoses added yet</p>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Treatment Tab */}
                {activeTab === 'treatment' && (
                  <motion.div
                    key="treatment"
                    ref={el => contentRefs.current.treatment = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Medications Section */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Pill size={20} className="text-green-400" />
                        Medications
                      </h3>
                      
                      {/* Current medications list */}
                      <div className="space-y-2 mb-4">
                        <AnimatePresence>
                          {(editData.medications || []).map((medication, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center justify-between p-3 bg-green-600/10 rounded-lg border border-green-600/20 group hover:bg-green-600/15 transition-colors"
                            >
                              <span className="text-green-300">{medication}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => removeItemDirectly('medications', medication)}
                                className="text-green-400 hover:text-green-200 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                title="Remove medication"
                              >
                                <X size={16} />
                              </motion.button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {/* Add new medication */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={getNewTag('medications')}
                          onChange={(e) => setNewTag('medications', e.target.value)}
                          placeholder="Add medication..."
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && getNewTag('medications').trim()) {
                              addItemDirectly('medications', getNewTag('medications'));
                              clearNewTag('medications');
                            }
                          }}
                        />
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (getNewTag('medications').trim()) {
                              addItemDirectly('medications', getNewTag('medications'));
                              clearNewTag('medications');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add
                        </motion.button>
                      </div>
                      
                      {(editData.medications || []).length === 0 && (
                        <p className="text-slate-500 italic text-center py-4">No medications added yet</p>
                      )}
                    </motion.div>

                    {/* Psychotherapy Modalities Section */}
                    <motion.div 
                      variants={cardVariants}
                      animate={editingSections.psychotherapy_modalities ? "edit" : "visible"}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Brain size={20} className="text-purple-400" />
                          Psychotherapy Modalities
                        </h3>
                        {!editingSections.psychotherapy_modalities && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEditingSection('psychotherapy_modalities')}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                            title="Edit psychotherapy modalities"
                          >
                            <Edit3 size={16} />
                          </motion.button>
                        )}
                      </div>
                      
                      {editingSections.psychotherapy_modalities ? (
                        <div className="space-y-4">
                          <textarea
                            value={Array.isArray(sectionData.psychotherapy_modalities?.psychotherapy_modalities) 
                              ? sectionData.psychotherapy_modalities.psychotherapy_modalities.join('\n') 
                              : Array.isArray(editData.psychotherapy_modalities)
                                ? editData.psychotherapy_modalities.join('\n')
                                : editData.psychotherapy_modalities || ''}
                            onChange={(e) => updateSectionField('psychotherapy_modalities', 'psychotherapy_modalities', e.target.value.split('\n').filter(item => item.trim()))}
                            rows={4}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            placeholder="Enter psychotherapy modalities (one per line)..."
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => cancelEditingSection('psychotherapy_modalities')}
                              className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                            <motion.button
                              onClick={() => saveSectionEdit('psychotherapy_modalities')}
                              disabled={isLoading}
                              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                            >
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              Save
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(editData.psychotherapy_modalities || []).length > 0 ? (
                            editData.psychotherapy_modalities.map((modality, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <span className="text-purple-400 font-medium">•</span>
                                <span className="text-slate-300">{modality}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">No psychotherapy modalities added</span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Connections Tab */}
                {activeTab === 'connections' && (
                  <motion.div
                    key="connections"
                    ref={el => contentRefs.current.connections = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Link2 size={20} className="text-blue-400" />
                        Connected Nodes
                      </h3>
                      <p className="text-slate-400 text-center py-8">
                        This section will show nodes connected to this topic in the mind map.
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TopicModal;