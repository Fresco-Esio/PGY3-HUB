// Simple Topic Modal for testing
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  BookOpen, 
  Brain, 
  Stethoscope,
  Pills,
  Link2
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
  }, [isOpen, data, hasInitialized, onAnimationStart, onAnimationEnd]);

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl px-6 py-4 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editData.title || 'Topic Details'}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-600">
              <nav className="flex flex-wrap gap-2 px-6 py-4">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                      activeTab === id
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
              <div className="h-full overflow-y-auto p-6 space-y-6">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-300">Topic overview content goes here...</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'concept' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Concept</h3>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-300">Concept content goes here...</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'clinical' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Clinical Associations</h3>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-300">Clinical content goes here...</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'treatment' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Treatment</h3>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-300">Treatment content goes here...</p>
                    </div>
                  </div>
                )}
                
                {activeTab === 'connections' && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Connections</h3>
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <p className="text-slate-300">Connections content goes here...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(TopicModal);