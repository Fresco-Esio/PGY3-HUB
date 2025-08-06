// Timeline Modal Component for PGY3-HUB
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, Activity } from 'lucide-react';
import VerticalTimeline from './timeline-test/VerticalTimeline';
import { sampleVerticalTimelineData } from './timeline-test/sampleVerticalTimelineData';

// Animation variants for the modal
const backdropVariants = {
  hidden: { 
    opacity: 0,
    backdropFilter: 'blur(0px)'
  },
  visible: { 
    opacity: 0.75,
    backdropFilter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

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
      stiffness: 300,
      damping: 25,
      duration: 0.5
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

const TimelineModal = ({ 
  isOpen, 
  onClose, 
  title = "Patient Timeline",
  data = sampleVerticalTimelineData,
  onNodeClick,
  onNodeHover
}) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    
    // Allow animation to complete before calling onClose
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose, isClosing]);

  const handleNodeClick = useCallback((node) => {
    console.log('Timeline node clicked:', node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node, isHovering) => {
    console.log('Timeline node hover:', node.id, isHovering);
    onNodeHover?.(node, isHovering);
  }, [onNodeHover]);

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait" onExitComplete={() => {
      setIsClosing(false);
    }}>
      {isOpen && (
        <motion.div
          key="timeline-modal-backdrop"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          className="fixed inset-0 bg-black flex items-center justify-center z-50 p-4"
          style={{ 
            willChange: 'backdrop-filter, opacity',
            backfaceVisibility: 'hidden',
            transform: 'translate3d(0, 0, 0)'
          }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            key="timeline-modal-content"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            style={{ 
              willChange: 'transform, opacity, scale',
              backfaceVisibility: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Interactive patient timeline with drag-and-drop nodes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>{data.length} nodes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Activity className="h-4 w-4" />
                    <span>Interactive</span>
                  </div>
                  <motion.button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Modal Content - Timeline Container */}
            <div className="relative" style={{ height: 'calc(90vh - 120px)' }}>
              <VerticalTimeline
                data={data}
                onNodeClick={handleNodeClick}
                onNodeHover={handleNodeHover}
              />
            </div>

            {/* Modal Footer with Instructions */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Instructions:</span> Drag nodes to reposition • Hover for details • Click to edit
                </div>
                <div className="text-xs text-gray-500">
                  Timeline Modal • Interactive Mode
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TimelineModal;
