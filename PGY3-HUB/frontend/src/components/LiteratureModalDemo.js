// Demo Literature Modal Test Component
import React, { useState } from 'react';
import { LiteratureModal } from '../components/LazyComponents';
import { sampleLiteratureData } from '../data/sampleLiteratureData';
import { BookOpen, TestTube } from 'lucide-react';

const LiteratureModalDemo = () => {
  const [modalState, setModalState] = useState({ isOpen: false, data: null });

  // Sample nodes to simulate connections
  const sampleNodes = [
    {
      id: 'case-101',
      type: 'case',
      data: {
        id: 101,
        label: 'Major Depression Case',
        primary_diagnosis: 'Major Depressive Disorder',
        chief_complaint: 'Persistent sadness and loss of interest',
        secondary_diagnoses: ['Anxiety', 'Insomnia']
      }
    },
    {
      id: 'topic-201',
      type: 'topic',
      data: {
        id: 201,
        title: 'Diagnostic Criteria',
        category: 'Assessment',
        tags: ['DSM-5', 'diagnosis', 'criteria']
      }
    },
    {
      id: 'case-102',
      type: 'case',
      data: {
        id: 102,
        label: 'Bipolar Disorder Case',
        primary_diagnosis: 'Bipolar I Disorder',
        chief_complaint: 'Mood swings and impulsivity'
      }
    }
  ];

  // Sample connections
  const sampleConnections = [
    { id: 'conn-1', source: 'literature-1', target: 'case-101', label: 'Treatment approach' },
    { id: 'conn-2', source: 'literature-2', target: 'topic-201', label: 'Reference guide' },
    { id: 'conn-3', source: 'literature-3', target: 'case-102', label: 'Medication guidance' }
  ];

  const openLiteratureModal = (literatureItem) => {
    setModalState({ isOpen: true, data: literatureItem });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <TestTube className="text-purple-600" />
            Literature Modal Demo
          </h1>
          <p className="text-gray-600">
            Click on any literature item below to test the enhanced tabbed modal interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sampleLiteratureData.map((item) => (
            <div
              key={item.id}
              onClick={() => openLiteratureModal(item)}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-purple-500 hover:scale-105"
            >
              <div className="flex items-start gap-3 mb-3">
                <BookOpen className="text-purple-600 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {item.authors} • {item.year}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                      item.type === 'meta-analysis' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                      item.type === 'guideline' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                      item.type === 'review' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      item.type === 'case-study' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                      'bg-gray-100 text-gray-800 border-gray-200'
                    }`}>
                      {item.type.toUpperCase().replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              {item.abstract && (
                <p className="text-xs text-gray-700 line-clamp-3">
                  {item.abstract.substring(0, 120)}...
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Features to Test:</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✨ <strong>Overview Tab:</strong> Complete publication details, keywords, and connected nodes</li>
            <li>📄 <strong>PDF Viewer Tab:</strong> Placeholder for embedded PDF viewing</li>
            <li>📝 <strong>Notes Tab:</strong> Personal annotation system</li>
            <li>🔗 <strong>Related Tab:</strong> Smart keyword-based literature recommendations</li>
            <li>🎭 <strong>Smooth Animations:</strong> Fade-in/fade-out modal transitions</li>
            <li>🔍 <strong>Search & Filter:</strong> Filter related literature by type and search terms</li>
          </ul>
        </div>

        {/* Literature Modal */}
        <LiteratureModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ isOpen: false, data: null })}
          literatureData={modalState.data}
          allNodes={sampleNodes}
          connections={sampleConnections}
        />
      </div>

      <style jsx>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LiteratureModalDemo;
