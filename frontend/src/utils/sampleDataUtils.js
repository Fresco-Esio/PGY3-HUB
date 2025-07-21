// Utility to populate sample literature data for testing
import { sampleLiteratureData, sampleConnections } from '../data/sampleLiteratureData';

export const populateSampleLiteratureData = (setMindMapData, autoSaveMindMapData, addToast) => {
  setMindMapData(prevData => {
    // Add sample literature items if they don't already exist
    const existingIds = new Set(prevData.literature.map(item => item.id));
    const newLiterature = sampleLiteratureData.filter(item => !existingIds.has(item.id));
    
    if (newLiterature.length === 0) {
      addToast('Sample literature data already exists', 'info');
      return prevData;
    }

    // Create sample case and topic nodes to connect with literature
    const sampleCases = [
      {
        id: 101,
        label: 'Major Depression Case',
        primary_diagnosis: 'Major Depressive Disorder',
        chief_complaint: 'Persistent sadness and loss of interest',
        secondary_diagnoses: ['Anxiety', 'Insomnia'],
        position: { x: 100, y: 100 }
      },
      {
        id: 102,
        label: 'Bipolar Disorder Case', 
        primary_diagnosis: 'Bipolar I Disorder',
        chief_complaint: 'Mood swings and impulsivity',
        position: { x: 200, y: 200 }
      },
      {
        id: 103,
        label: 'Generalized Anxiety Case',
        primary_diagnosis: 'Generalized Anxiety Disorder',
        chief_complaint: 'Excessive worry and restlessness',
        position: { x: 300, y: 300 }
      },
      {
        id: 104,
        label: 'Schizophrenia Case',
        primary_diagnosis: 'Schizophrenia',
        chief_complaint: 'Auditory hallucinations and delusions',
        position: { x: 400, y: 400 }
      }
    ];

    const sampleTopics = [
      {
        id: 201,
        title: 'Diagnostic Criteria',
        category: 'Assessment',
        tags: ['DSM-5', 'diagnosis', 'criteria'],
        position: { x: 150, y: 50 }
      }
    ];

    // Filter out existing cases and topics
    const existingCaseIds = new Set(prevData.cases.map(item => item.id));
    const existingTopicIds = new Set(prevData.topics.map(item => item.id));
    
    const newCases = sampleCases.filter(item => !existingCaseIds.has(item.id));
    const newTopics = sampleTopics.filter(item => !existingTopicIds.has(item.id));

    // Add sample connections
    const existingConnectionIds = new Set(prevData.connections.map(conn => conn.id));
    const newConnections = sampleConnections.filter(conn => !existingConnectionIds.has(conn.id));

    const updatedData = {
      ...prevData,
      literature: [...prevData.literature, ...newLiterature],
      cases: [...prevData.cases, ...newCases],
      topics: [...prevData.topics, ...newTopics],
      connections: [...prevData.connections, ...newConnections]
    };

    // Save the updated data
    autoSaveMindMapData(updatedData);
    addToast(`Added ${newLiterature.length} literature items, ${newCases.length} cases, and ${newTopics.length} topics`, 'success');
    
    return updatedData;
  });
};

export const clearSampleData = (setMindMapData, autoSaveMindMapData, addToast) => {
  setMindMapData(prevData => {
    // Remove sample data based on IDs
    const sampleLiteratureIds = new Set(sampleLiteratureData.map(item => item.id));
    const sampleConnectionIds = new Set(sampleConnections.map(conn => conn.id));
    const sampleCaseIds = new Set([101, 102, 103, 104]);
    const sampleTopicIds = new Set([201]);

    const updatedData = {
      ...prevData,
      literature: prevData.literature.filter(item => !sampleLiteratureIds.has(item.id)),
      cases: prevData.cases.filter(item => !sampleCaseIds.has(item.id)),
      topics: prevData.topics.filter(item => !sampleTopicIds.has(item.id)),
      connections: prevData.connections.filter(conn => !sampleConnectionIds.has(conn.id))
    };

    autoSaveMindMapData(updatedData);
    addToast('Sample literature data cleared', 'success');
    
    return updatedData;
  });
};
