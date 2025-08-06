// Integration Test: VerticalTimeline in CaseModal
// This file can be used to test the integration without running the full app

import React from 'react';
import VerticalTimeline from './timeline-test/VerticalTimeline';

// Sample timeline data for testing
const sampleTimelineData = [
  {
    id: 'entry-1',
    date: '2025-01-01T10:00:00Z',
    timestamp: '2025-01-01T10:00:00Z',
    patient_narrative: 'Patient presented with initial symptoms...',
    clinical_notes: 'Initial assessment shows...',
    patientData: { notes: 'Patient narrative content' },
    clinicalData: { notes: 'Clinical assessment content' }
  },
  {
    id: 'entry-2', 
    date: '2025-01-02T14:30:00Z',
    timestamp: '2025-01-02T14:30:00Z',
    patient_narrative: 'Follow-up visit, patient reports...',
    clinical_notes: 'Continued monitoring reveals...',
    patientData: { notes: 'Follow-up narrative' },
    clinicalData: { notes: 'Follow-up clinical notes' }
  }
];

// Mock functions for testing
const mockSetMindMapData = (updateFunction) => {
  console.log('mockSetMindMapData called with:', updateFunction);
};

const mockAutoSaveMindMapData = (data) => {
  console.log('mockAutoSaveMindMapData called with:', data);
};

const mockOnDataChange = (data) => {
  console.log('mockOnDataChange called with:', data);
};

// Test component
export const TimelineIntegrationTest = () => {
  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <h2>Timeline Integration Test</h2>
      <VerticalTimeline
        data={sampleTimelineData}
        caseId="test-case-123"
        setMindMapData={mockSetMindMapData}
        autoSaveMindMapData={mockAutoSaveMindMapData}
        onDataChange={mockOnDataChange}
      />
    </div>
  );
};

export default TimelineIntegrationTest;
