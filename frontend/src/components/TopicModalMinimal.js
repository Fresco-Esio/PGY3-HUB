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
  Pills,
  Users,
  Tag,
  Calendar,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

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
  
  // Tab-specific scroll positions
  const [scrollPositions, setScrollPositions] = useState({});
  const contentRefs = useRef({});
  
  // Form states for different tabs
  const [newTag, setNewTag] = useState('');
  const [showAddComorbidity, setShowAddComorbidity] = useState(false);
  const [showAddDifferential, setShowAddDifferential] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [expandedCriteria, setExpandedCriteria] = useState(false);

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
    { id: 'treatment', label: 'Treatment', icon: Pills },
    { id: 'connections', label: 'Connections', icon: Link2 }
  ];

  useEffect(() => {
    if (isOpen && data && !hasInitialized) {
      setIsVisible(true);
      setEditData({ 
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
      setScrollPositions({});
    }
  }, [isOpen, data, hasInitialized, onAnimationStart, onAnimationEnd]);

  const progressPercentage = useMemo(() => {
    const total = editData.flashcard_count || 0;
    const completed = editData.completed_flashcards || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [editData.flashcard_count, editData.completed_flashcards]);

  const handleClose = useCallback(() => {
    if (isAnimating || isLoading) return;
    
    setIsClosing(true);
    setIsAnimating(true);
    if (onAnimationStart) onAnimationStart();
    
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setIsAnimating(false);
      if (onAnimationEnd) onAnimationEnd();
      onClose();
    }, 600);
  }, [isAnimating, isLoading, onAnimationStart, onAnimationEnd, onClose]);

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
      setIsEditing(false);
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

  // Utility functions for managing form fields
  const updateField = useCallback((field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Tag management functions
  const addTag = useCallback((field, tag) => {
    if (!tag.trim() || !editData[field]) return;
    
    const currentTags = editData[field] || [];
    if (!currentTags.includes(tag.trim())) {
      updateField(field, [...currentTags, tag.trim()]);
    }
    setNewTag('');
  }, [editData, updateField]);

  const removeTag = useCallback((field, tagToRemove) => {
    const currentTags = editData[field] || [];
    updateField(field, currentTags.filter(tag => tag !== tagToRemove));
  }, [editData, updateField]);

  // Category change handler - updates node color in mind map
  const handleCategoryChange = useCallback((newCategory) => {
    updateField('category', newCategory);
    
    // Update node color in mind map immediately
    setMindMapData(prevData => {
      const updatedTopics = prevData.topics.map(topic =>
        String(topic.id) === String(data?.id) 
          ? { ...topic, category: newCategory, color: categoryColors[newCategory]?.primary || categoryColors.Other.primary }
          : topic
      );
      const newData = { ...prevData, topics: updatedTopics };
      // Don't auto-save here, wait for manual save
      return newData;
    });
  }, [updateField, data?.id, setMindMapData, categoryColors]);

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

  if (!isOpen) return null;