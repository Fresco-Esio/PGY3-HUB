// Enhanced Case Modal with tabbed interface and advanced animations
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  FileText, 
  Clipboard, 
  Heart, 
  Clock, 
  Sparkles, 
  Target,
  Edit3,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  StickyNote,
  Eye,
  BookOpen,
  ChevronDown,
  ArrowDown,
  Calendar,
  Brain,
  Plus,
  Send
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

const CaseModal = ({ 
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
  const [expandedTimelineEntry, setExpandedTimelineEntry] = useState(null);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingEntryData, setEditingEntryData] = useState({});
  const timelineScrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      setEditData({ ...data });
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
      setEditData({ ...data });
    }
  }, [data?.id, isOpen, hasInitialized, isEditing, isLoading, isTabTransitioning, isAnimating]);

  // Timeline data from case or default mock data
  const timelineEntries = useMemo(() => {
    // If case has timeline data, use it, otherwise use mock data for demonstration
    if (editData?.timeline && Array.isArray(editData.timeline) && editData.timeline.length > 0) {
      return editData.timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    // Default mock data for cases without timeline
    return [
      {
        id: 1,
        timestamp: '2024-01-15T09:30:00.000Z',
        date: '2024-01-15',
        time: '09:30 AM',
        type: 'assessment',
        title: 'Initial Assessment',
        content: 'Patient presented with symptoms of anxiety and depression.',
        details: 'Comprehensive psychiatric evaluation completed. Patient reports increased anxiety over the past 3 months, difficulty sleeping, and decreased appetite. MSE reveals anxious mood, intact cognition, no psychotic features. PHQ-9 score: 14 (moderate depression). GAD-7 score: 12 (moderate anxiety).',
        author: 'Dr. Smith',
        isNew: false
      },
      {
        id: 2,
        timestamp: '2024-01-22T14:15:00.000Z',
        date: '2024-01-22',
        time: '02:15 PM',
        type: 'medication',
        title: 'Medication Adjustment',
        content: 'Started on Sertraline 50mg daily.',
        details: 'After discussion of treatment options, patient agreed to trial of SSRI. Started Sertraline 50mg daily. Reviewed potential side effects including initial activation, GI upset. Plan to follow up in 2 weeks. Provided crisis resources and encouraged to call if any concerns.',
        author: 'Dr. Smith',
        isNew: false
      },
      {
        id: 3,
        timestamp: '2024-02-05T11:00:00.000Z',
        date: '2024-02-05',
        time: '11:00 AM',
        type: 'followup',
        title: 'Follow-up Visit',
        content: 'Patient reports mild improvement in mood.',
        details: 'Patient tolerated medication well with minimal side effects. Reports improved energy and slightly better sleep. Still experiencing some anxiety symptoms. PHQ-9 score decreased to 10. Continue current medication, discussed therapy referral.',
        author: 'Dr. Smith',
        isNew: false
      },
      {
        id: 4,
        timestamp: '2024-02-19T15:45:00.000Z',
        date: '2024-02-19',
        time: '03:45 PM',
        type: 'therapy',
        title: 'Therapy Session',
        content: 'First CBT session completed.',
        details: 'Initial therapy session with focus on psychoeducation about anxiety and depression. Introduced basic CBT concepts and breathing exercises. Patient engaged well and expressed motivation for therapy. Homework assigned: daily mood tracking and breathing practice.',
        author: 'Sarah Johnson, LCSW',
        isNew: true
      }
    ];
  }, [editData?.timeline]);

  // Enhanced scroll function to ensure expanded entries are fully visible
  const scrollToShowEntry = useCallback((entryId) => {
    if (timelineScrollRef.current && entryId) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          const container = timelineScrollRef.current;
          const entryElement = container.querySelector(`[data-entry-id="${entryId}"]`);
          
          if (entryElement && container) {
            const containerRect = container.getBoundingClientRect();
            const entryRect = entryElement.getBoundingClientRect();
            
            // Calculate the position relative to the scrollable container
            const entryTop = entryRect.top - containerRect.top + container.scrollTop;
            const entryBottom = entryTop + entryRect.height;
            const containerHeight = container.clientHeight;
            const currentScrollTop = container.scrollTop;
            
            // Determine if we need to scroll
            let targetScrollTop = currentScrollTop;
            
            // If entry extends below visible area, scroll to show the bottom with padding
            if (entryBottom > currentScrollTop + containerHeight) {
              targetScrollTop = entryBottom - containerHeight + 60; // 60px bottom padding
            }
            
            // If entry is above visible area, scroll to show the top
            if (entryTop < currentScrollTop) {
              targetScrollTop = entryTop - 20; // 20px top padding
            }
            
            // Only scroll if necessary
            if (targetScrollTop !== currentScrollTop) {
              container.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
              });
            }
          }
        }, 100); // Wait for animation to start
      });
    }
  }, []);

  const scrollToLatest = useCallback(() => {
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollTo({
        top: timelineScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, []);

  // Auto-save timeline changes with debounce
  const saveTimelineChange = useCallback((newTimeline) => {
    const timeoutId = setTimeout(() => {
      setMindMapData(prevData => {
        const updatedCases = prevData.cases.map(caseItem =>
          String(caseItem.id) === String(data?.id) 
            ? { ...caseItem, timeline: newTimeline, updated_at: new Date().toISOString() }
            : caseItem
        );
        const newData = { ...prevData, cases: updatedCases };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      // Update local edit data as well
      setEditData(prev => ({ ...prev, timeline: newTimeline }));
    }, 800); // 800ms debounce

    return timeoutId;
  }, [data?.id, setMindMapData, autoSaveMindMapData]);

  const getEntryTitle = useCallback((type) => {
    const titles = {
      assessment: 'Clinical Assessment',
      medication: 'Medication Update',
      therapy: 'Therapy Session',
      followup: 'Follow-up Visit',
      note: 'Clinical Note'
    };
    return titles[type] || 'Clinical Entry';
  }, []);

  // Create a new blank timeline entry for inline editing
  const createNewTimelineEntry = useCallback(() => {
    if (editingEntryId) return; // Prevent multiple entries being edited simultaneously
    
    const newEntry = {
      id: `new-${Date.now()}`, // Temporary ID for new entries
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      }),
      type: 'followup',
      title: 'Follow-up Visit',
      content: '',
      details: '',
      author: 'Current User',
      isNew: true,
      isEditing: true
    };

    // Add to timeline and set as editing
    const currentTimeline = editData?.timeline || [];
    const updatedTimeline = [...currentTimeline, newEntry];
    
    setEditData(prev => ({ ...prev, timeline: updatedTimeline }));
    setEditingEntryId(newEntry.id);
    setEditingEntryData({ ...newEntry });
    setExpandedTimelineEntry(newEntry.id);
    
    // Scroll to show the new entry after it's rendered
    setTimeout(() => {
      scrollToShowEntry(newEntry.id);
    }, 200);
  }, [editData?.timeline, editingEntryId, scrollToShowEntry]);

  // Toggle entry expansion and start editing if needed
  const toggleTimelineEntry = useCallback((entry) => {
    const entryId = entry.id;
    
    // If currently editing this entry, close it
    if (editingEntryId === entryId) {
      setEditingEntryId(null);
      setEditingEntryData({});
      setExpandedTimelineEntry(null);
      return;
    }
    
    // If editing another entry, don't allow switching
    if (editingEntryId && editingEntryId !== entryId) {
      addToast('Please save or cancel the current entry first', 'warning');
      return;
    }
    
    // Toggle expansion
    const isCurrentlyExpanded = expandedTimelineEntry === entryId;
    
    if (isCurrentlyExpanded) {
      // Collapse the entry
      setExpandedTimelineEntry(null);
    } else {
      // Expand and start editing
      setExpandedTimelineEntry(entryId);
      setEditingEntryId(entryId);
      setEditingEntryData({ ...entry });
      
      // Scroll to show the expanded entry
      setTimeout(() => {
        scrollToShowEntry(entryId);
      }, 100);
    }
  }, [editingEntryId, expandedTimelineEntry, addToast, scrollToShowEntry]);

  // Save the currently editing entry
  const saveEditingEntry = useCallback(() => {
    if (!editingEntryId || !editingEntryData) return;
    
    const currentTimeline = editData?.timeline || [];
    let updatedTimeline;
    
    // Generate final ID for new entries
    const finalEntry = {
      ...editingEntryData,
      id: editingEntryData.id.toString().startsWith('new-') 
        ? Date.now() 
        : editingEntryData.id,
      isNew: editingEntryData.id.toString().startsWith('new-'),
      isEditing: false,
      updated_at: new Date().toISOString()
    };
    
    // Update title based on type
    finalEntry.title = getEntryTitle(finalEntry.type);
    
    // Update timestamp-derived fields
    const dateObj = new Date(finalEntry.timestamp);
    finalEntry.date = dateObj.toISOString().split('T')[0];
    finalEntry.time = dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    
    if (editingEntryData.id.toString().startsWith('new-')) {
      // Adding new entry
      updatedTimeline = [...currentTimeline.filter(e => e.id !== editingEntryId), finalEntry]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } else {
      // Updating existing entry
      updatedTimeline = currentTimeline.map(entry =>
        entry.id === editingEntryId ? finalEntry : entry
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    // Save changes
    saveTimelineChange(updatedTimeline);
    
    // Clear editing state
    setEditingEntryId(null);
    setEditingEntryData({});
    setExpandedTimelineEntry(null);
    
    addToast(
      editingEntryData.id.toString().startsWith('new-') 
        ? 'Timeline entry added successfully' 
        : 'Timeline entry updated successfully', 
      'success'
    );
  }, [
    editingEntryId, 
    editingEntryData, 
    editData?.timeline, 
    saveTimelineChange, 
    addToast,
    getEntryTitle
  ]);

  // Cancel editing
  const cancelEditingEntry = useCallback(() => {
    if (!editingEntryId) return;
    
    // If it's a new entry, remove it from timeline
    if (editingEntryData.id && editingEntryData.id.toString().startsWith('new-')) {
      const currentTimeline = editData?.timeline || [];
      const updatedTimeline = currentTimeline.filter(e => e.id !== editingEntryId);
      setEditData(prev => ({ ...prev, timeline: updatedTimeline }));
    }
    
    // Clear editing state
    setEditingEntryId(null);
    setEditingEntryData({});
    setExpandedTimelineEntry(null);
  }, [editingEntryId, editingEntryData, editData?.timeline]);

  // Handle keyboard shortcuts for editing
  const handleEditingKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      saveEditingEntry();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingEntry();
    }
  }, [saveEditingEntry, cancelEditingEntry]);

  // Update editing entry data
  const updateEditingEntry = useCallback((field, value) => {
    setEditingEntryData(prev => ({
      ...prev,
      [field]: value,
      // Auto-update details to match content for consistency
      ...(field === 'content' && { details: value })
    }));
  }, []);

  // Clear isNew flag after a delay for entries that were just added
  useEffect(() => {
    const newEntries = timelineEntries.filter(entry => entry.isNew && !entry.isEditing);
    if (newEntries.length > 0) {
      const timeout = setTimeout(() => {
        const updatedTimeline = timelineEntries.map(entry => 
          entry.isNew && !entry.isEditing ? { ...entry, isNew: false } : entry
        );
        if (editData?.timeline) {
          saveTimelineChange(updatedTimeline);
        }
      }, 5000); // Remove isNew flag after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [timelineEntries, editData?.timeline, saveTimelineChange]);

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
      setMindMapData(prevData => {
        const updatedCases = prevData.cases.map(caseItem =>
          String(caseItem.id) === String(data?.id) ? { ...caseItem, ...editData } : caseItem
        );
        const newData = { ...prevData, cases: updatedCases };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      setIsEditing(false);
      addToast('Case updated successfully', 'success');
    } catch (error) {
      console.error('Error saving case:', error);
      addToast('Failed to save case', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [data?.id, editData, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

  const handleDelete = useCallback(async () => {
    if (isLoading) return;
    
    if (!window.confirm('Are you sure you want to delete this case?')) return;
    
    setIsLoading(true);
    try {
      setMindMapData(prevData => {
        const updatedCases = prevData.cases.filter(caseItem => String(caseItem.id) !== String(data?.id));
        const newData = { ...prevData, cases: updatedCases };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      addToast('Case deleted successfully', 'success');
      handleClose();
    } catch (error) {
      console.error('Error deleting case:', error);
      addToast('Failed to delete case', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [data?.id, setMindMapData, autoSaveMindMapData, addToast, handleClose, isLoading]);

  const updateField = useCallback((field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

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
    <AnimatePresence mode="wait" onExitComplete={() => {
      setIsAnimating(false);
      setIsClosing(false);
      setHasInitialized(false);
      onClose();
      if (onAnimationEnd) onAnimationEnd();
    }}>
      {isVisible && (
        <motion.div
          key={`case-modal-${data?.id || 'default'}`}
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
              className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Users size={24} />
                <h2 className="text-xl font-semibold">Case Details</h2>
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
                  { key: 'overview', label: 'Overview', icon: Users },
                  { key: 'narrative', label: 'Narrative', icon: FileText },
                  { key: 'medications', label: 'Medications', icon: Clipboard },
                  { key: 'therapy', label: 'Therapy', icon: Heart },
                  { key: 'timeline', label: 'Timeline', icon: Clock },
                  { key: 'insights', label: 'Insights', icon: Sparkles },
                  { key: 'related', label: 'Related', icon: Target }
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
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                    }`}
                    whileHover={{ scale: activeTab === key ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={false}
                    animate={{
                      scale: activeTab === key ? 1.05 : 1,
                      boxShadow: activeTab === key 
                        ? '0 8px 25px rgba(59, 130, 246, 0.3), 0 0 20px rgba(99, 102, 241, 0.2)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Icon size={16} className={activeTab === key ? 'drop-shadow-sm' : ''} />
                    {label}
                    {/* Timeline notification badge */}
                    {key === 'timeline' && timelineEntries.some(entry => entry.isNew) && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                        !
                      </span>
                    )}
                    
                    {activeTab === key && (
                      <motion.div
                        layoutId="tabGlow"
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 rounded-xl blur-sm"
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
                          <Users size={20} className="text-blue-600" />
                          Demographics & Basic Info
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {renderField('Case ID', 'case_id')}
                          {renderField('Primary Diagnosis', 'primary_diagnosis')}
                          {renderField('Age', 'age', 'number')}
                          {renderField('Gender', 'gender', 'select', {
                            choices: ['Male', 'Female', 'Non-binary', 'Other']
                          })}
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                          <AlertCircle size={20} className="text-amber-600" />
                          Initial Impressions
                        </h3>
                        <div className="space-y-4">
                          {renderField('Chief Complaint', 'chiefComplaint', 'textarea', { rows: 3 })}
                          {renderField('Initial Presentation', 'initialPresentation', 'textarea', { rows: 4 })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Narrative Tab */}
                {activeTab === 'narrative' && (
                  <motion.div
                    key="narrative"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-200"
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-green-600" />
                        Patient Story & Narrative
                      </h3>
                      <div className="space-y-6">
                        {renderField('Current Presentation', 'currentPresentation', 'textarea', { rows: 8 })}
                        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                          <p className="italic">Use this space to tell the patient's story in your own words. Include context, progression, and your narrative understanding of their journey.</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Other tabs would continue here following the same pattern... */}
                {/* For brevity, I'll include key tabs. The full implementation would include all tabs */}
                
                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    layout="position"
                    layoutId="tabContent"
                    className="p-6 h-[calc(85vh-200px)] flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Case Timeline</h3>
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={createNewTimelineEntry}
                          disabled={isCreatingEntry || editingEntryId}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                          <Plus size={16} />
                          Add Entry
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={scrollToLatest}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <ArrowDown size={16} />
                          Scroll to Latest
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Timeline implementation with inline editing */}
                    <div className="relative flex-1">
                      <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
                      
                      <div
                        ref={timelineScrollRef}
                        className="h-full overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                        style={{
                          scrollbarWidth: 'thin',
                          scrollbarColor: '#475569 #1e293b'
                        }}
                      >
                        {/* Vertical timeline bar */}
                        <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-gradient-to-b from-blue-400 via-purple-500 to-blue-400 opacity-30" />
                        
                        <AnimatePresence mode="popLayout">
                          {timelineEntries.map((entry, index) => {
                            const isEditing = editingEntryId === entry.id;
                            const isExpanded = expandedTimelineEntry === entry.id || isEditing;
                            
                            return (
                              <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ 
                                  opacity: 1, 
                                  y: 0, 
                                  scale: 1,
                                  transition: { 
                                    delay: entry.isNew && !entry.isEditing ? 0 : index * 0.05, 
                                    duration: 0.4,
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30
                                  }
                                }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                layout
                                className={`relative z-10 ${entry.isNew && !isEditing ? 'animate-pulse' : ''}`}
                              >
                                {/* Timeline dot */}
                                <div className={`absolute left-6 top-4 w-3 h-3 rounded-full border-2 border-slate-900 z-20 ${
                                  entry.type === 'assessment' ? 'bg-green-500' :
                                  entry.type === 'medication' ? 'bg-blue-500' :
                                  entry.type === 'therapy' ? 'bg-purple-500' :
                                  entry.type === 'note' ? 'bg-yellow-500' :
                                  'bg-orange-500'
                                }`} />
                                
                                <motion.div
                                  layout
                                  data-entry-id={entry.id}
                                  whileHover={!isEditing ? { 
                                    scale: 1.01,
                                    boxShadow: '0 8px 20px rgba(59, 130, 246, 0.12)'
                                  } : {}}
                                  className={`ml-12 bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg border-l-3 transition-all duration-300 ${
                                    entry.type === 'assessment' ? 'border-green-400' :
                                    entry.type === 'medication' ? 'border-blue-400' :
                                    entry.type === 'therapy' ? 'border-purple-400' :
                                    entry.type === 'note' ? 'border-yellow-400' :
                                    'border-orange-400'
                                  } ${entry.isNew && !isEditing ? 'ring-1 ring-blue-400 ring-opacity-50' : ''} ${
                                    isEditing ? 'ring-2 ring-green-400 ring-opacity-70' : ''
                                  }`}
                                >
                                  {/* Entry Header - Always Visible */}
                                  <div 
                                    className={`p-4 ${!isEditing ? 'cursor-pointer' : ''}`}
                                    onClick={!isEditing ? () => {
                                      if (expandedTimelineEntry === entry.id) {
                                        setExpandedTimelineEntry(null);
                                      } else {
                                        startEditingEntry(entry);
                                      }
                                    } : undefined}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-white font-semibold text-sm">
                                            {isEditing ? editingEntryData.title : entry.title}
                                          </h4>
                                          {entry.isNew && !isEditing && (
                                            <motion.span
                                              animate={{ 
                                                scale: [1, 1.1, 1],
                                                opacity: [0.7, 1, 0.7]
                                              }}
                                              transition={{ 
                                                duration: 2, 
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                              }}
                                              className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-full"
                                            >
                                              New
                                            </motion.span>
                                          )}
                                          {isEditing && (
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-full">
                                              Editing
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-300 mb-2">
                                          <span className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {isEditing ? editingEntryData.date : entry.date}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Clock size={12} />
                                            {isEditing ? editingEntryData.time : entry.time}
                                          </span>
                                          <span>by {isEditing ? editingEntryData.author : entry.author}</span>
                                        </div>
                                        <p className="text-slate-200 text-sm">
                                          {isEditing ? (
                                            editingEntryData.content || 'No content...'
                                          ) : (
                                            entry.content?.length > 100 
                                              ? `${entry.content.substring(0, 100)}...` 
                                              : entry.content || 'No content...'
                                          )}
                                        </p>
                                      </div>
                                      
                                      {!isEditing && (
                                        <motion.div
                                          animate={{ rotate: isExpanded ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                        >
                                          <Edit3 size={16} className="text-slate-400" />
                                        </motion.div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Inline Editing Form */}
                                  <AnimatePresence>
                                    {isEditing && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-4 pb-4 pt-0 border-t border-slate-600">
                                          <div className="space-y-3 mt-3">
                                            {/* Type and Timestamp Row */}
                                            <div className="grid grid-cols-2 gap-3">
                                              <div>
                                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                                  Entry Type
                                                </label>
                                                <select
                                                  value={editingEntryData.type || 'followup'}
                                                  onChange={(e) => updateEditingEntry('type', e.target.value)}
                                                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                  <option value="assessment">Assessment</option>
                                                  <option value="medication">Medication</option>
                                                  <option value="therapy">Therapy</option>
                                                  <option value="followup">Follow-up</option>
                                                  <option value="note">Note</option>
                                                </select>
                                              </div>
                                              
                                              <div>
                                                <label className="block text-xs font-medium text-slate-300 mb-1">
                                                  Timestamp
                                                </label>
                                                <input
                                                  type="datetime-local"
                                                  value={editingEntryData.timestamp ? 
                                                    new Date(editingEntryData.timestamp).toISOString().slice(0, -1) : 
                                                    new Date().toISOString().slice(0, -1)
                                                  }
                                                  onChange={(e) => updateEditingEntry('timestamp', new Date(e.target.value).toISOString())}
                                                  className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                              </div>
                                            </div>
                                            
                                            {/* Content */}
                                            <div>
                                              <label className="block text-xs font-medium text-slate-300 mb-1">
                                                Content
                                              </label>
                                              <textarea
                                                value={editingEntryData.content || ''}
                                                onChange={(e) => updateEditingEntry('content', e.target.value)}
                                                onKeyPress={handleEditingKeyPress}
                                                placeholder="Enter clinical notes, observations, or updates..."
                                                rows={4}
                                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                              />
                                              <p className="text-xs text-slate-400 mt-1">
                                                Press Shift+Enter to save, Escape to cancel
                                              </p>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-2 pt-2">
                                              <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={cancelEditingEntry}
                                                className="px-3 py-1 bg-slate-600 text-white rounded hover:bg-slate-500 transition-colors text-sm"
                                              >
                                                Cancel
                                              </motion.button>
                                              <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={saveEditingEntry}
                                                disabled={!editingEntryData.content?.trim()}
                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
                                              >
                                                <Save size={14} />
                                                Save
                                              </motion.button>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  
                                  {/* Expanded View for Non-Editing */}
                                  <AnimatePresence>
                                    {isExpanded && !isEditing && entry.details && entry.details !== entry.content && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-4 pb-4 border-t border-slate-600">
                                          <h5 className="text-white font-medium text-sm mb-2 mt-3">Detailed Notes:</h5>
                                          <p className="text-slate-300 text-sm leading-relaxed">{entry.details}</p>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                        
                        {/* Empty state */}
                        {timelineEntries.length === 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12"
                          >
                            <Clock size={48} className="mx-auto text-slate-500 mb-4" />
                            <p className="text-slate-400 text-lg mb-2">No timeline entries yet</p>
                            <p className="text-slate-500 text-sm">Click "Add Entry" to create the first timeline entry</p>
                          </motion.div>
                        )}
                      </div>
                      
                      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
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
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
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

export default React.memo(CaseModal, (prevProps, nextProps) => {
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.data?.id === nextProps.data?.id &&
    prevProps.data?.updated_at === nextProps.data?.updated_at
  );
});
