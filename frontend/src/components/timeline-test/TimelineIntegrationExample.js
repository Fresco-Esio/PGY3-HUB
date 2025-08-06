import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Users, Calendar } from 'lucide-react';
import VerticalTimeline from './VerticalTimeline';

/**
 * Example component showing how to integrate VerticalTimeline into a Case Modal
 * This demonstrates the consistent save method integration with the main mind map
 */
const TimelineIntegrationExample = ({ 
  isOpen, 
  caseData, 
  onClose,
  setMindMapData,
  autoSaveMindMapData,
  addToast 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Handle timeline data changes - this integrates with the main mind map save system
  const handleTimelineDataChange = useCallback(async (timelineData) => {
    try {
      console.log('Timeline data updated:', timelineData);
      // The VerticalTimeline component already handles the mind map integration
      // through its saveTimelineData function when caseId is provided
      addToast?.('Timeline updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update timeline:', error);
      addToast?.('Failed to update timeline', 'error');
    }
  }, [addToast]);

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: 30,
      transition: { duration: 0.3 }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
    visible: { 
      opacity: 1, 
      backdropFilter: 'blur(8px)',
      transition: { duration: 0.4 }
    },
    exit: { 
      opacity: 0, 
      backdropFilter: 'blur(0px)',
      transition: { duration: 0.3 }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'timeline', label: 'Patient Timeline', icon: Clock }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Case: {caseData?.case_id || 'Unknown'}
                </h2>
                <p className="text-sm text-gray-500">
                  Patient Timeline Integration Example
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 h-full overflow-y-auto"
                >
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Case Overview
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Case ID</label>
                        <p className="text-gray-900">{caseData?.case_id || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Primary Diagnosis</label>
                        <p className="text-gray-900">{caseData?.primary_diagnosis || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Age</label>
                        <p className="text-gray-900">{caseData?.age || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Gender</label>
                        <p className="text-gray-900">{caseData?.gender || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="text-sm font-medium text-gray-700">Chief Complaint</label>
                      <p className="text-gray-900 mt-1">
                        {caseData?.chief_complaint || caseData?.chiefComplaint || 'No chief complaint recorded'}
                      </p>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Timeline Integration</span>
                      </div>
                      <p className="text-blue-700 text-sm mt-1">
                        Switch to the "Patient Timeline" tab to view and edit the interactive patient timeline. 
                        All changes are automatically saved to the main mind map using the consistent save system.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <motion.div
                  key="timeline"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <VerticalTimeline
                    data={caseData?.timeline || []}
                    onDataChange={handleTimelineDataChange}
                    // Mind map integration props - this enables consistent saving
                    caseId={caseData?.id}
                    setMindMapData={setMindMapData}
                    autoSaveMindMapData={autoSaveMindMapData}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated: {caseData?.last_updated 
                  ? new Date(caseData.last_updated).toLocaleString()
                  : 'Never'
                }
              </div>
              <div className="text-sm text-gray-500">
                Timeline entries: {caseData?.timeline?.length || 0}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TimelineIntegrationExample;
