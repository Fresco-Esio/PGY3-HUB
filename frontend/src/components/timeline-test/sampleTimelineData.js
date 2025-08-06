export const sampleTimelineData = [
  {
    id: 'node-1',
    type: 'patient',
    date: '2024-01-15',
    title: 'Initial Assessment',
    patientInfo: {
      age: 28,
      gender: 'Female',
      chiefComplaint: 'Persistent feelings of sadness and hopelessness for the past 3 months',
      initialPresentation: 'Patient presents with depressed mood, anhedonia, sleep disturbances, and decreased appetite. Reports feeling overwhelmed by work stress and relationship difficulties.',
      currentSymptoms: ['Depressed mood', 'Anhedonia', 'Sleep disturbances', 'Decreased appetite', 'Fatigue']
    },
    clinicalInfo: {
      diagnosis: 'Major Depressive Disorder, Single Episode, Moderate Severity',
      assessment: 'Patient meets criteria for MDD. No psychotic features present. Good insight and judgment intact.',
      plan: 'Initiate SSRI therapy, weekly psychotherapy sessions, sleep hygiene education',
      medications: ['Sertraline 50mg daily'],
      riskFactors: ['Work stress', 'Relationship difficulties', 'Family history of depression']
    },
    position: { x: 100, y: 200 },
    side: 'left'
  },
  {
    id: 'node-2',
    type: 'clinical',
    date: '2024-02-01',
    title: 'Follow-up Visit',
    patientInfo: {
      age: 28,
      gender: 'Female',
      currentPresentation: 'Mild improvement in mood. Sleep quality slightly better. Still experiencing some anhedonia and low energy.',
      currentSymptoms: ['Mild depressed mood', 'Partial anhedonia', 'Improved sleep', 'Low energy']
    },
    clinicalInfo: {
      assessment: 'Partial response to sertraline. Patient tolerating medication well with minimal side effects.',
      plan: 'Continue current dose of sertraline. Increase therapy frequency. Add behavioral activation techniques.',
      medications: ['Sertraline 50mg daily'],
      progress: 'Improving but gradual'
    },
    position: { x: 300, y: 150 },
    side: 'right'
  },
  {
    id: 'node-3',
    type: 'patient',
    date: '2024-02-15',
    title: 'Therapy Session',
    patientInfo: {
      age: 28,
      gender: 'Female',
      currentPresentation: 'Patient reports increased motivation to engage in activities. Mood episodes less frequent but still present.',
      currentSymptoms: ['Intermittent low mood', 'Increased motivation', 'Better social engagement']
    },
    clinicalInfo: {
      assessment: 'Good therapeutic alliance established. Patient actively participating in CBT techniques.',
      plan: 'Continue CBT focus on cognitive restructuring and behavioral activation',
      therapyProgress: 'Engaging well with therapy. Showing insight into thought patterns.',
      interventions: ['Cognitive restructuring', 'Behavioral activation', 'Mood monitoring']
    },
    position: { x: 500, y: 220 },
    side: 'left'
  },
  {
    id: 'node-4',
    type: 'clinical',
    date: '2024-03-01',
    title: 'Medication Review',
    patientInfo: {
      age: 28,
      gender: 'Female',
      currentPresentation: 'Significant improvement in mood and energy. Sleep normalized. Appetite returning to baseline.',
      currentSymptoms: ['Stable mood', 'Good energy', 'Normal sleep', 'Appetite restored']
    },
    clinicalInfo: {
      assessment: 'Excellent response to treatment. Patient in partial remission. No significant side effects.',
      plan: 'Continue sertraline at current dose. Transition to bi-weekly therapy sessions.',
      medications: ['Sertraline 50mg daily'],
      progress: 'Significant improvement',
      riskAssessment: 'Low risk for relapse with continued treatment'
    },
    position: { x: 700, y: 180 },
    side: 'right'
  },
  {
    id: 'node-5',
    type: 'patient',
    date: '2024-03-15',
    title: 'Relapse Prevention',
    patientInfo: {
      age: 28,
      gender: 'Female',
      currentPresentation: 'Patient maintaining stable mood. Actively using coping strategies learned in therapy.',
      currentSymptoms: ['Stable mood', 'Active coping', 'Good social functioning']
    },
    clinicalInfo: {
      assessment: 'Patient in full remission. Strong insight and coping skills developed.',
      plan: 'Continue medication. Monthly maintenance therapy sessions. Develop long-term relapse prevention plan.',
      therapyProgress: 'Excellent. Patient demonstrating independence in managing symptoms.',
      relapsePreventionPlan: [
        'Continue medication compliance',
        'Regular sleep schedule',
        'Stress management techniques',
        'Social support maintenance',
        'Early warning sign recognition'
      ]
    },
    position: { x: 900, y: 160 },
    side: 'left'
  }
];

// Connection data for timeline flow
export const sampleConnections = [
  { source: 'node-1', target: 'node-2', type: 'progression' },
  { source: 'node-2', target: 'node-3', type: 'progression' },
  { source: 'node-3', target: 'node-4', type: 'progression' },
  { source: 'node-4', target: 'node-5', type: 'progression' }
];
