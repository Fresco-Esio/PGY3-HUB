import React, { useState, useEffect } from 'react';
import { sampleVerticalTimelineData } from './sampleVerticalTimelineData';
import SimpleGSAPTest from './SimpleGSAPTest';
import TimelineModal from '../TimelineModal';

const TimelineTestPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showSimpleTest, setShowSimpleTest] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
  };

  const handleNodeHover = (node, isHovering) => {
    console.log('Node hover:', node.id, isHovering);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Loading timeline test...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interactive Patient Timeline
          </h1>
          <p className="text-gray-600">
            Test timeline components in modal and standalone formats
          </p>
          <div className="mt-4 space-x-4">
            <button 
              onClick={() => setShowTimelineModal(true)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Open Timeline Modal
            </button>
            <button 
              onClick={() => setShowSimpleTest(!showSimpleTest)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {showSimpleTest ? 'Hide Simple GSAP Test' : 'Show Simple GSAP Test'}
            </button>
          </div>
        </div>

        {showSimpleTest && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Simple GSAP Test</h2>
            <SimpleGSAPTest />
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Timeline Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Modal Interface</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Timeline contained within a professional modal</li>
                <li>• Matches existing mind map modal styling</li>
                <li>• Proper backdrop blur and animations</li>
                <li>• Responsive sizing with scroll containment</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-800">Interaction</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Drag nodes with instant 1:1 mouse tracking</li>
                <li>• Hover over nodes to see patient/clinical cards</li>
                <li>• Click nodes to edit both cards simultaneously</li>
                <li>• Add new nodes with smooth animations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Modal */}
      <TimelineModal
        isOpen={showTimelineModal}
        onClose={() => setShowTimelineModal(false)}
        title="Patient Timeline - Interactive Mode"
        data={sampleVerticalTimelineData}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
      />
    </div>
  );
};

export default TimelineTestPage;
