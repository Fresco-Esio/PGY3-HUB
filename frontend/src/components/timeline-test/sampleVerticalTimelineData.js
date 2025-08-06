export const sampleVerticalTimelineData = [
  {
    id: 'entry-001',
    timestamp: '2024-01-14T10:00:00Z',
    date: '2024-01-14',
    title: 'Initial Assessment',
    type: 'patient',
    patientData: {
      chiefComplaint: 'Feeling increasingly anxious and unable to concentrate at work',
      currentStatus: 'First visit - seeking help for anxiety symptoms',
      notes: 'Patient reports 3-month history of generalized anxiety, sleep disturbances, and difficulty focusing. No prior psychiatric treatment.'
    },
    clinicalData: {
      chiefComplaint: 'Generalized Anxiety Disorder assessment',
      currentStatus: 'Initial diagnostic evaluation completed',
      notes: 'GAD-7 score: 14 (moderate anxiety). Recommended CBT and consider medication. No suicidal ideation. Good insight and motivation for treatment.'
    }
  },
  {
    id: 'entry-002',
    timestamp: '2024-01-31T14:00:00Z',
    date: '2024-01-31',
    title: 'Follow-up Visit',
    type: 'clinical',
    patientData: {
      chiefComplaint: 'Some improvement in sleep, but still feeling very anxious during work meetings',
      currentStatus: 'Two weeks on sertraline 50mg, attending weekly therapy',
      notes: 'Medication side effects minimal. Using breathing techniques learned in therapy with some success. Still avoiding certain social situations.'
    },
    clinicalData: {
      chiefComplaint: 'Medication response evaluation',
      currentStatus: 'Partial response to initial treatment',
      notes: 'GAD-7 score: 11 (mild-moderate). Continue sertraline, increase to 75mg. Therapy showing good engagement. Consider exposure exercises.'
    }
  },
  {
    id: 'entry-003',
    timestamp: '2024-02-14T11:00:00Z',
    date: '2024-02-14',
    title: 'Therapy Session',
    type: 'patient',
    patientData: {
      chiefComplaint: 'Had a panic attack at work last week, but handled it better than before',
      currentStatus: 'Learning coping strategies, medication helping with baseline anxiety',
      notes: 'Successfully used grounding techniques during panic attack. Feeling more confident about managing symptoms. Sleep much improved.'
    },
    clinicalData: {
      chiefComplaint: 'Panic episode management and progress review',
      currentStatus: 'Good therapeutic progress with CBT techniques',
      notes: 'Patient demonstrating skill acquisition in anxiety management. Panic attack was brief and well-managed. Continue current treatment plan.'
    }
  },
  {
    id: 'entry-004',
    timestamp: '2024-02-29T16:00:00Z',
    date: '2024-02-29',
    title: 'Medication Review',
    type: 'clinical',
    patientData: {
      chiefComplaint: 'Feeling much more stable, anxiety is manageable most days',
      currentStatus: 'Sertraline 75mg working well, regular therapy sessions',
      notes: 'Returned to normal work performance. Able to participate in meetings without significant anxiety. Relationship with partner improving.'
    },
    clinicalData: {
      chiefComplaint: 'Treatment response assessment',
      currentStatus: 'Good response to combined therapy and medication',
      notes: 'GAD-7 score: 6 (mild). Significant improvement achieved. Plan to continue current dose, transition to bi-weekly therapy sessions.'
    }
  },
  {
    id: 'entry-005',
    timestamp: '2024-03-14T13:00:00Z',
    date: '2024-03-14',
    title: 'Relapse Prevention',
    type: 'patient',
    patientData: {
      chiefComplaint: 'Doing well overall, want to focus on preventing future episodes',
      currentStatus: 'Stable on current treatment, learning long-term management',
      notes: 'Confident in ability to manage anxiety symptoms. Interested in gradually reducing therapy frequency while maintaining medication.'
    },
    clinicalData: {
      chiefComplaint: 'Maintenance and relapse prevention planning',
      currentStatus: 'Treatment goals largely achieved, planning maintenance phase',
      notes: 'Excellent treatment response. Develop relapse prevention plan, continue medication, monthly check-ins. Consider therapy as needed basis.'
    }
  }
];
