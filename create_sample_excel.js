const XLSX = require('xlsx');
const path = require('path');

// Sample patient data
const sampleData = [
  {
    'First Name': 'John',
    'Last Name': 'Doe',
    'Chief Complaint': 'Persistent sadness and loss of interest in activities',
    'Initial Presentation': 'Patient presents with 3-month history of depressed mood, decreased appetite, and insomnia',
    'Narrative Summary': 'Patient is a 35-year-old male with major depressive disorder. Reports feeling sad most days, has lost interest in hobbies, experiencing sleep difficulties.',
    'Status': 'active'
  },
  {
    'First Name': 'Jane',
    'Last Name': 'Smith',
    'Chief Complaint': 'Anxiety and panic attacks',
    'Initial Presentation': 'Patient reports increasing anxiety over past 6 months with frequent panic attacks',
    'Narrative Summary': 'Patient is a 28-year-old female with generalized anxiety disorder. Experiences excessive worry, physical tension, and occasional panic attacks.',
    'Status': 'active'
  },
  {
    'First Name': 'Michael',
    'Last Name': 'Johnson',
    'Chief Complaint': 'Sleep disturbances and racing thoughts',
    'Initial Presentation': 'Patient describes alternating periods of high and low mood with associated sleep changes',
    'Narrative Summary': 'Patient is a 42-year-old male with bipolar disorder. Currently in depressive phase with history of manic episodes.',
    'Status': 'follow_up'
  },
  {
    'First Name': 'Sarah',
    'Last Name': 'Williams',
    'Chief Complaint': 'Intrusive thoughts and compulsive behaviors',
    'Initial Presentation': 'Patient reports distressing intrusive thoughts and time-consuming rituals',
    'Narrative Summary': 'Patient is a 31-year-old female with OCD. Spends several hours daily on checking and cleaning rituals.',
    'Status': 'active'
  },
  {
    'First Name': 'Robert',
    'Last Name': 'Brown',
    'Chief Complaint': 'Social withdrawal and flat affect',
    'Initial Presentation': 'Family reports patient has been increasingly isolated with blunted emotional expression',
    'Narrative Summary': 'Patient is a 26-year-old male with schizophrenia spectrum disorder. Presents with negative symptoms and social dysfunction.',
    'Status': 'active'
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Set column widths for better readability
worksheet['!cols'] = [
  { wch: 15 }, // First Name
  { wch: 15 }, // Last Name
  { wch: 40 }, // Chief Complaint
  { wch: 50 }, // Initial Presentation
  { wch: 60 }, // Narrative Summary
  { wch: 12 }  // Status
];

// Append worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

// Write the file
const outputPath = path.join(__dirname, 'test_patient_import.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(`Sample Excel file created: ${outputPath}`);
