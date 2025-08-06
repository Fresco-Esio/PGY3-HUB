// Enhanced Case Modal with tabbed interface and advanced animations
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  FileText, 
  Pill, 
  Brain, 
  Link2,
  Edit3,
  Trash2,
  Save,
  Loader2,
  Plus,
  Check,
  Calendar,
  Clock,
  AlertCircle,
  BookOpen,
  Target,
  Heart,
  ChevronDown,
  ChevronRight,
  Activity
} from 'lucide-react';

// Import the Vertical Timeline component
import VerticalTimeline from './timeline-test/VerticalTimeline';

// Utility function for debouncing
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

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
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '', frequency: '', effect: '' });
  const [showMedicationForm, setShowMedicationForm] = useState(false);

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      const initialData = { 
        ...data,
        narrative_summary: data.narrative_summary || '',
        medications: data.medications || [],
        therapeutic_highlights: data.therapeutic_highlights || '',
        timeline: data.timeline || [], // Initialize timeline
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
    
    // Set visibility to false to trigger exit animation
    setIsVisible(false);
  }, [onAnimationStart, isAnimating, isClosing]);

  // Escape key handling to close modal - MOVED AFTER handleClose definition
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleClose]);

  const handleSave = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const updatedData = {
        ...editData,
        last_updated: new Date().toISOString()
      };
      
      setMindMapData(prevData => {
        const updatedCases = prevData.cases.map(caseItem =>
          String(caseItem.id) === String(data?.id) ? { ...caseItem, ...updatedData } : caseItem
        );
        const newData = { ...prevData, cases: updatedCases };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      setEditData(updatedData);
      addToast('Case updated successfully', 'success');
    } catch (error) {
      console.error('Error saving case:', error);
      addToast('Failed to save case', 'error');
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

  // Section editing functionality
  const toggleEditSection = useCallback((sectionId) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
    
    // Initialize section data if starting to edit
    if (!editingSections[sectionId]) {
      setSectionData(prev => ({
        ...prev,
        [sectionId]: {
          // Initialize with current values from editData
          ...(sectionId === 'basic_info' && {
            label: editData.label || editData.title || '',
            status: editData.status || 'active'
          }),
          ...(sectionId === 'chief_complaint' && {
            content: editData.chiefComplaint || editData.chief_complaint || ''
          }),
          ...(sectionId === 'initial_presentation' && {
            content: editData.initialPresentation || editData.initial_presentation || ''
          }),
          ...(sectionId === 'narrative' && {
            content: editData.narrative_summary || ''
          }),
          ...(sectionId === 'therapeutic_highlights' && {
            therapeutic_highlights: editData.therapeutic_highlights || ''
          })
        }
      }));
    }
  }, [editingSections, editData]);

  const updateSectionData = useCallback((sectionId, field, value) => {
    // Update sectionData for temporary editing state
    setSectionData(prev => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [field]: value
      }
    }));
  }, []);

  const cancelEdit = useCallback((sectionId) => {
    setEditingSections(prev => ({
      ...prev,
      [sectionId]: false
    }));
    setSectionData(prev => {
      const newData = { ...prev };
      delete newData[sectionId];
      return newData;
    });
  }, []);

  const saveSection = useCallback(async (sectionId) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const sectionChanges = sectionData[sectionId] || {};
      let updatedData = { ...editData };
      
      // Apply section-specific changes
      if (sectionId === 'basic_info') {
        if (sectionChanges.label) {
          updatedData.label = sectionChanges.label;
          updatedData.title = sectionChanges.label; // Also update title for compatibility
        }
        if (sectionChanges.status) {
          updatedData.status = sectionChanges.status;
        }
      } else if (sectionId === 'chief_complaint') {
        if (sectionChanges.content !== undefined) {
          updatedData.chief_complaint = sectionChanges.content;
          updatedData.chiefComplaint = sectionChanges.content;
        }
      } else if (sectionId === 'initial_presentation') {
        if (sectionChanges.content !== undefined) {
          updatedData.initial_presentation = sectionChanges.content;
          updatedData.initialPresentation = sectionChanges.content;
        }
      } else if (sectionId === 'narrative') {
        if (sectionChanges.content !== undefined) {
          updatedData.narrative_summary = sectionChanges.content;
        }
      }
      
      updatedData.last_updated = new Date().toISOString();
      
      // Update editData immediately for instant feedback
      setEditData(updatedData);
      
      // Update parent data
      setMindMapData(prevData => {
        const updatedCases = prevData.cases.map(caseItem =>
          String(caseItem.id) === String(data?.id) ? { ...caseItem, ...updatedData } : caseItem
        );
        const newData = { ...prevData, cases: updatedCases };
        autoSaveMindMapData(newData);
        return newData;
      });
      
      // Clear editing state
      setEditingSections(prev => ({
        ...prev,
        [sectionId]: false
      }));
      setSectionData(prev => {
        const newData = { ...prev };
        delete newData[sectionId];
        return newData;
      });
      
      addToast('Case information updated successfully', 'success');
      
    } catch (error) {
      console.error('Error saving section:', error);
      addToast('Failed to save changes', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [sectionData, editData, data?.id, setMindMapData, autoSaveMindMapData, addToast, isLoading]);

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
        const updatedCases = prevData.cases.map(caseItem =>
          String(caseItem.id) === String(data?.id) ? { ...caseItem, ...updatedData } : caseItem
        );
        const newData = { ...prevData, cases: updatedCases };
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

  // Medication management functions
  const addMedication = useCallback(() => {
    if (!newMedication.name.trim()) return;
    
    const updatedMedications = [...(editData.medications || []), { 
      id: Date.now(),
      ...newMedication,
      dateAdded: new Date().toISOString()
    }];
    
    const updatedData = {
      ...editData,
      medications: updatedMedications,
      last_updated: new Date().toISOString()
    };
    
    setEditData(updatedData);
    
    setMindMapData(prevData => {
      const updatedCases = prevData.cases.map(caseItem =>
        String(caseItem.id) === String(data?.id) ? { ...caseItem, ...updatedData } : caseItem
      );
      const newData = { ...prevData, cases: updatedCases };
      autoSaveMindMapData(newData);
      return newData;
    });
    
    setNewMedication({ name: '', dosage: '', frequency: '', effect: '' });
    setShowMedicationForm(false);
    addToast('Medication added successfully', 'success');
  }, [newMedication, editData, data?.id, setMindMapData, autoSaveMindMapData, addToast]);

  const removeMedication = useCallback((medicationId) => {
    const updatedMedications = (editData.medications || []).filter(med => med.id !== medicationId);
    const updatedData = {
      ...editData,
      medications: updatedMedications,
      last_updated: new Date().toISOString()
    };
    
    setEditData(updatedData);
    
    setMindMapData(prevData => {
      const updatedCases = prevData.cases.map(caseItem =>
        String(caseItem.id) === String(data?.id) ? { ...caseItem, ...updatedData } : caseItem
      );
      const newData = { ...prevData, cases: updatedCases };
      autoSaveMindMapData(newData);
      return newData;
    });
    
    addToast('Medication removed successfully', 'success');
  }, [editData, data?.id, setMindMapData, autoSaveMindMapData, addToast]);

  // Enhanced timeline management with debounced auto-save and better backend integration
  const timelineEntries = useMemo(() => {
    // Ensure timeline data is properly structured for the VerticalTimeline component
    const timeline = editData.timeline || [];
    console.log(`Timeline entries for case ${data?.id}:`, timeline);
    return timeline;
  }, [editData.timeline, data?.id]);
  
  // Debounced timeline save function with enhanced error handling
  const debouncedTimelineSave = useCallback(
    debounce(async (updatedTimeline, retryCount = 0) => {
      try {
        // Validate timeline data structure
        const validatedTimeline = updatedTimeline.map((entry, index) => ({
          id: entry.id || `timeline-${data?.id}-${Date.now()}-${index}`,
          title: entry.title || `Timeline Entry ${index + 1}`,
          type: entry.type || 'timeline_entry',
          timestamp: entry.timestamp || entry.date || new Date().toISOString(),
          date: entry.date || entry.timestamp || new Date().toISOString(),
          patient_narrative: entry.patient_narrative || entry.patientData?.notes || '',
          clinical_notes: entry.clinical_notes || entry.clinicalData?.notes || '',
          content: entry.content || entry.patient_narrative || entry.clinical_notes || '',
          symptoms: entry.symptoms || [],
          orderIndex: entry.orderIndex !== undefined ? entry.orderIndex : index,
          x: entry.x || 400, // Default center position
          y: entry.y || (100 + (index * 200)), // Default spacing
          created_at: entry.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Keep original data for backward compatibility
          ...entry
        }));

        const updatedData = {
          ...editData,
          timeline: validatedTimeline,
          last_updated: new Date().toISOString()
        };
        
        // Update editData immediately for instant feedback
        setEditData(updatedData);
        
        // Enhanced mind map data update with better timeline integration
        setMindMapData(prevData => {
          const updatedCases = prevData.cases.map(caseItem => {
            if (String(caseItem.id) === String(data?.id)) {
              return { 
                ...caseItem, 
                ...updatedData,
                // Ensure timeline data is properly structured for backend
                timeline: validatedTimeline.map(entry => ({
                  id: String(entry.id || `${Date.now()}-${caseItem.id}-timeline-${entry.orderIndex || 0}`),
                  title: entry.title || `Timeline Entry ${(entry.orderIndex || 0) + 1}`,
                  type: entry.type || 'timeline_entry',
                  timestamp: entry.timestamp || entry.date || new Date().toISOString(),
                  date: entry.date || entry.timestamp || new Date().toISOString(),
                  patient_narrative: entry.patient_narrative || '',
                  clinical_notes: entry.clinical_notes || '',
                  content: entry.content || entry.patient_narrative || entry.clinical_notes || '',
                  symptoms: entry.symptoms || [],
                  orderIndex: entry.orderIndex !== undefined ? entry.orderIndex : 0,
                  x: Number(entry.x) || 400,
                  y: Number(entry.y) || 100,
                  created_at: entry.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }))
              };
            }
            return caseItem;
          });
          const newData = { ...prevData, cases: updatedCases };
          autoSaveMindMapData(newData);
          return newData;
        });
        
        return { success: true, data: updatedData };
      } catch (error) {
        console.error('Timeline save error:', error);
        
        // Retry logic - up to 3 attempts
        if (retryCount < 3) {
          console.log(`Retrying timeline save (attempt ${retryCount + 1}/3)`);
          return debouncedTimelineSave(updatedTimeline, retryCount + 1);
        }
        
        return { success: false, error };
      }
    }, 500), // 500ms debounce
    [editData, data?.id, setMindMapData, autoSaveMindMapData]
  );
  
  const updateTimeline = useCallback(async (updatedTimeline, options = {}) => {
    if (isLoading && !options.force) return;
    
    // Enhanced validation - check for meaningful content or position changes
    const hasContent = updatedTimeline.some(entry => 
      (entry.patient_narrative && entry.patient_narrative.trim()) ||
      (entry.clinical_notes && entry.clinical_notes.trim()) ||
      (entry.content && entry.content.trim()) ||
      entry.x !== 400 || entry.y !== 100 // Position has changed from default
    );
    
    // Always save if forced or if there's meaningful content/changes
    if (!hasContent && !options.force) {
      console.log('Skipping timeline save - no meaningful content or changes');
      return { success: true, skipped: true };
    }
    
    console.log(`Updating timeline for case ${data?.id} with ${updatedTimeline.length} entries`);
    return debouncedTimelineSave(updatedTimeline);
  }, [debouncedTimelineSave, isLoading, data?.id]);

  // Get connected nodes for Related tab
  const connectedNodes = useMemo(() => {
    if (!data?.id) return { topics: [], literature: [], cases: [] };
    
    // This would typically come from your mind map connections data
    // For now, return empty arrays - you can implement based on your data structure
    return {
      topics: [],
      literature: [],
      cases: []
    };
  }, [data?.id]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'therapy', label: 'Therapy & Insights', icon: Brain },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'related', label: 'Related', icon: Link2 }
  ];

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
            className={`bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] overflow-hidden transition-all duration-500 ease-in-out ${
              activeTab === 'timeline' ? 'max-w-7xl' : 'max-w-4xl'
            }`}
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
                <Users size={24} />
                <h2 className="text-xl font-semibold">Case Details</h2>
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
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
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
                        layoutId="caseActiveTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 rounded-xl blur-sm"
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
                    {/* Case Title and Basic Info */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Case Information</h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleEditSection('basic_info')}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                          title="Edit case information"
                        >
                          <Edit3 size={16} />
                        </motion.button>
                      </div>
                      
                      {editingSections.basic_info ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Case Title/Label</label>
                              <input
                                type="text"
                                value={sectionData.basic_info?.label !== undefined ? sectionData.basic_info.label : (editData.label || editData.title || '')}
                                onChange={(e) => updateSectionData('basic_info', 'label', e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                                placeholder="Enter case title/label"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                              <select
                                value={sectionData.basic_info?.status !== undefined ? sectionData.basic_info.status : (editData.status || 'active')}
                                onChange={(e) => updateSectionData('basic_info', 'status', e.target.value)}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                              >
                                <option value="active">Active</option>
                                <option value="archived">Archived</option>
                                <option value="follow_up">Follow-up</option>
                                <option value="completed">Completed</option>
                              </select>
                            </div>
                          </div>
                          
                          {/* Action buttons area - consistent height */}
                          <div className="flex gap-2 justify-end min-h-[44px] items-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => cancelEdit('basic_info')}
                              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => saveSection('basic_info')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Save size={16} />
                              Save Changes
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Case Title/Label</label>
                              <div className={`bg-slate-700/50 rounded-lg p-3 ${editData.label || editData.title ? 'text-white' : 'text-slate-400 italic'}`}>
                                {editData.label || editData.title || 'Untitled case'}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
                              <div className="text-white bg-slate-700/50 rounded-lg p-3">
                                {editData.status || 'Active'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Reserved space for action buttons - maintains consistent height */}
                          <div className="flex gap-2 justify-end min-h-[44px] items-center">
                            {/* Empty space to maintain layout consistency */}
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Narrative Summary */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <FileText size={20} className="text-blue-400" />
                          Case Narrative
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleEditSection('narrative')}
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                          title="Edit narrative summary"
                        >
                          <Edit3 size={16} />
                        </motion.button>
                      </div>
                      
                      {editingSections.narrative ? (
                        <div className="space-y-4">
                          <textarea
                            value={sectionData.narrative?.content !== undefined ? sectionData.narrative.content : (editData.narrative_summary || '')}
                            onChange={(e) => updateSectionData('narrative', 'content', e.target.value)}
                            rows={8}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                            placeholder="Enter the narrative summary for this case..."
                          />
                          
                          {/* Action buttons area - consistent height */}
                          <div className="flex gap-2 justify-end min-h-[44px] items-center">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => cancelEdit('narrative')}
                              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition-colors"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => saveSection('narrative')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                              <Save size={16} />
                              Save Changes
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className={`leading-relaxed bg-slate-700/30 rounded-lg p-4 ${editData.narrative_summary ? 'text-slate-300' : 'text-slate-400 italic'}`}>
                            {editData.narrative_summary || 'No narrative summary documented'}
                          </div>
                          
                          {/* Reserved space for action buttons - maintains consistent height */}
                          <div className="flex gap-2 justify-end min-h-[44px] items-center">
                            {/* Empty space to maintain layout consistency */}
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {/* Last Updated */}
                    <div className="text-xs text-slate-500 text-right">
                      Last updated: {editData.last_updated ? new Date(editData.last_updated).toLocaleString() : 'Never'}
                    </div>
                  </motion.div>
                )}

                {/* Medications Tab */}
                {activeTab === 'medications' && (
                  <motion.div
                    key="medications"
                    ref={el => contentRefs.current.medications = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Medications List */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Pill size={20} className="text-green-400" />
                        Current Medications
                      </h3>
                      
                      {/* Existing Medications */}
                      <div className="space-y-4 mb-6">
                        <AnimatePresence>
                          {(editData.medications || []).map((medication, index) => (
                            <motion.div
                              key={medication.id || index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="bg-green-600/10 border border-green-600/20 rounded-lg p-4 group hover:bg-green-600/15 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-green-300">{medication.name}</h4>
                                    {medication.dosage && (
                                      <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded">
                                        {medication.dosage}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-sm text-slate-300">
                                    {medication.frequency && (
                                      <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-green-400" />
                                        <span>Frequency: {medication.frequency}</span>
                                      </div>
                                    )}
                                    {medication.effect && (
                                      <div className="flex items-center gap-2">
                                        <Activity size={14} className="text-green-400" />
                                        <span>Effect: {medication.effect}</span>
                                      </div>
                                    )}
                                    {medication.dateAdded && (
                                      <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-green-400" />
                                        <span>Added: {new Date(medication.dateAdded).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeMedication(medication.id)}
                                  className="text-green-400 hover:text-green-200 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                                  title="Remove medication"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      {/* Add New Medication */}
                      {!showMedicationForm ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowMedicationForm(true)}
                          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-green-600/30 rounded-lg text-green-400 hover:border-green-600/50 hover:bg-green-600/5 transition-colors"
                        >
                          <Plus size={16} />
                          Add New Medication
                        </motion.button>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-700/30 rounded-lg p-4 space-y-4"
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Medication Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={newMedication.name}
                                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Enter medication name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Dosage</label>
                              <input
                                type="text"
                                value={newMedication.dosage}
                                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., 50mg"
                              />
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Frequency</label>
                              <input
                                type="text"
                                value={newMedication.frequency}
                                onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., Once daily"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Effect/Notes</label>
                              <input
                                type="text"
                                value={newMedication.effect}
                                onChange={(e) => setNewMedication(prev => ({ ...prev, effect: e.target.value }))}
                                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g., Improved mood"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setShowMedicationForm(false);
                                setNewMedication({ name: '', dosage: '', frequency: '', effect: '' });
                              }}
                              className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={addMedication}
                              disabled={!newMedication.name.trim()}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus size={16} />
                              Add Medication
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                      
                      {(editData.medications || []).length === 0 && !showMedicationForm && (
                        <p className="text-slate-500 italic text-center py-8">No medications documented yet</p>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Therapy & Insights Tab */}
                {activeTab === 'therapy' && (
                  <motion.div
                    key="therapy"
                    ref={el => contentRefs.current.therapy = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Therapeutic Highlights Section */}
                    <motion.div 
                      variants={cardVariants}
                      animate={editingSections.therapeutic_highlights ? "edit" : "visible"}
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Brain size={20} className="text-purple-400" />
                          Therapeutic Highlights
                        </h3>
                        {!editingSections.therapeutic_highlights && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEditingSection('therapeutic_highlights')}
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
                            title="Edit therapeutic highlights"
                          >
                            <Edit3 size={16} />
                          </motion.button>
                        )}
                      </div>
                      
                      {editingSections.therapeutic_highlights ? (
                        <motion.div 
                          className="space-y-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <textarea
                            value={sectionData.therapeutic_highlights?.therapeutic_highlights !== undefined ? sectionData.therapeutic_highlights.therapeutic_highlights : (editData.therapeutic_highlights || '')}
                            onChange={(e) => updateSectionField('therapeutic_highlights', 'therapeutic_highlights', e.target.value)}
                            rows={10}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            placeholder="Enter key therapeutic moments, insights, breakthroughs, or notes on therapy process..."
                          />
                          <div className="flex justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => cancelEditingSection('therapeutic_highlights')}
                              className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                            >
                              Cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => saveSectionEdit('therapeutic_highlights')}
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
                          className="text-slate-300 leading-relaxed cursor-pointer hover:bg-slate-700/20 rounded-lg p-4 transition-colors min-h-[200px]"
                          whileHover={{ scale: 1.01 }}
                          transition={{ duration: 0.2 }}
                          onClick={() => startEditingSection('therapeutic_highlights')}
                        >
                          {editData.therapeutic_highlights ? (
                            <div className="whitespace-pre-wrap">{editData.therapeutic_highlights}</div>
                          ) : (
                            <span className="text-slate-500 italic">Click to add therapeutic highlights, key moments, insights, breakthroughs, or therapy process notes...</span>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Timeline Tab */}
                {activeTab === 'timeline' && (
                  <motion.div
                    key="timeline"
                    ref={el => contentRefs.current.timeline = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    <VerticalTimeline
                      data={timelineEntries}
                      caseId={data?.id}
                      setMindMapData={setMindMapData}
                      autoSaveMindMapData={autoSaveMindMapData}
                      onDataChange={(timelineData) => {
                        // Handle timeline data changes - the VerticalTimeline handles the save internally
                        console.log('Timeline data updated:', timelineData);
                        addToast('Timeline updated successfully', 'success');
                      }}
                    />
                  </motion.div>
                )}

                {/* Related Tab */}
                {activeTab === 'related' && (
                  <motion.div
                    key="related"
                    ref={el => contentRefs.current.related = el}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full overflow-y-auto p-6 space-y-6"
                  >
                    {/* Connected Nodes */}
                    <motion.div 
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700"
                    >
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Link2 size={20} className="text-cyan-400" />
                        Connected Nodes
                      </h3>
                      
                      {/* Topics */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <Brain size={16} className="text-blue-400" />
                          Related Topics
                        </h4>
                        {connectedNodes.topics.length > 0 ? (
                          <div className="space-y-2">
                            {connectedNodes.topics.map((topic, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
                                <Brain size={16} className="text-blue-400" />
                                <span className="text-blue-300">{topic.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-sm">No connected topics</p>
                        )}
                      </div>

                      {/* Literature */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <BookOpen size={16} className="text-purple-400" />
                          Related Literature
                        </h4>
                        {connectedNodes.literature.length > 0 ? (
                          <div className="space-y-2">
                            {connectedNodes.literature.map((lit, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-purple-600/10 border border-purple-600/20 rounded-lg">
                                <BookOpen size={16} className="text-purple-400" />
                                <span className="text-purple-300">{lit.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-sm">No connected literature</p>
                        )}
                      </div>

                      {/* Other Cases */}
                      <div>
                        <h4 className="text-md font-medium text-slate-300 mb-3 flex items-center gap-2">
                          <Users size={16} className="text-green-400" />
                          Related Cases
                        </h4>
                        {connectedNodes.cases.length > 0 ? (
                          <div className="space-y-2">
                            {connectedNodes.cases.map((caseNode, index) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-green-600/10 border border-green-600/20 rounded-lg">
                                <Users size={16} className="text-green-400" />
                                <span className="text-green-300">{caseNode.title}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-sm">No connected cases</p>
                        )}
                      </div>

                      <div className="mt-6 p-4 bg-slate-700/20 rounded-lg border border-slate-600">
                        <p className="text-slate-400 text-sm italic">
                          Connected nodes will be automatically populated based on mind map relationships and connections created in the graph view.
                        </p>
                      </div>
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

export default CaseModal;