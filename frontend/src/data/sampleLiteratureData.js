// Sample literature data for testing the enhanced Literature modal
export const sampleLiteratureData = [
  {
    id: 1,
    title: "Efficacy of Cognitive Behavioral Therapy for Depression: A Meta-Analysis",
    authors: "Smith, J.A., Johnson, B.K., Williams, C.D.",
    year: "2023",
    type: "meta-analysis",
    journal: "Journal of Clinical Psychology",
    volume: "79",
    pages: "234-251",
    doi: "10.1002/jclp.23456",
    abstract: "This meta-analysis examines the efficacy of cognitive behavioral therapy (CBT) for treating major depressive disorder across 45 randomized controlled trials involving 3,242 participants. Results indicate that CBT shows significant effectiveness with a large effect size (d = 0.85) compared to control conditions. The analysis also reveals that individual CBT may be more effective than group CBT for severe depression cases.",
    keywords: "cognitive behavioral therapy, depression, meta-analysis, psychotherapy, mental health",
    notes: "",
    pdf_url: "https://example.com/sample-cbt-meta-analysis.pdf",
    position: { x: 300, y: 100 }
  },
  {
    id: 2,
    title: "DSM-5-TR Clinical Cases",
    authors: "American Psychiatric Association",
    year: "2022",
    type: "guideline",
    journal: "American Psychiatric Publishing",
    abstract: "A comprehensive collection of clinical cases that illustrate the diagnostic criteria and clinical features of mental disorders as defined in the DSM-5-TR. Each case includes detailed patient presentations, differential diagnoses, and treatment considerations.",
    keywords: "DSM-5, diagnosis, clinical cases, psychiatric disorders, differential diagnosis",
    notes: "Essential reference for diagnostic clarity",
    position: { x: 500, y: 200 }
  },
  {
    id: 3,
    title: "Pharmacological Treatment of Bipolar Disorder: Current Evidence",
    authors: "Rodriguez, M.L., Chen, K.H., Anderson, P.R.",
    year: "2023",
    type: "review",
    journal: "Bipolar Disorders",
    volume: "25",
    pages: "123-145",
    doi: "10.1111/bdi.13289",
    abstract: "This comprehensive review examines current evidence for pharmacological treatments of bipolar disorder, including mood stabilizers, antipsychotics, and adjunctive therapies. The review covers efficacy, safety profiles, and treatment-resistant cases.",
    keywords: "bipolar disorder, pharmacotherapy, mood stabilizers, lithium, antipsychotics",
    notes: "Important for medication management decisions",
    position: { x: 700, y: 150 }
  },
  {
    id: 4,
    title: "Mindfulness-Based Interventions for Anxiety Disorders: A Systematic Review",
    authors: "Taylor, S.M., Brown, A.J., Davis, L.K.",
    year: "2023",
    type: "review",
    journal: "Clinical Psychology Review",
    volume: "88",
    pages: "102-118",
    abstract: "Systematic review of mindfulness-based interventions for treating various anxiety disorders. Analysis of 28 studies shows moderate to large effect sizes for reducing anxiety symptoms, with particular effectiveness for generalized anxiety disorder.",
    keywords: "mindfulness, anxiety disorders, meditation, systematic review, GAD",
    notes: "Good evidence for mindfulness approaches",
    position: { x: 400, y: 300 }
  },
  {
    id: 5,
    title: "Case Study: Treatment-Resistant Schizophrenia with Clozapine",
    authors: "Wilson, K.R., Martinez, E.S.",
    year: "2022",
    type: "case-study",
    journal: "Schizophrenia Bulletin",
    volume: "48",
    pages: "567-572",
    abstract: "Detailed case study of a 28-year-old male with treatment-resistant schizophrenia who showed significant improvement after clozapine initiation. The case discusses monitoring protocols, side effect management, and long-term outcomes.",
    keywords: "schizophrenia, clozapine, treatment-resistant, case study, antipsychotics",
    notes: "Useful for understanding clozapine protocols",
    position: { x: 600, y: 400 }
  }
];

// Sample connections between literature and other nodes
export const sampleConnections = [
  {
    id: "conn-1",
    source: "literature-1",
    target: "case-101", // Depression case
    label: "Treatment approach"
  },
  {
    id: "conn-2", 
    source: "literature-2",
    target: "topic-201", // Diagnostic criteria topic
    label: "Reference guide"
  },
  {
    id: "conn-3",
    source: "literature-3",
    target: "case-102", // Bipolar case
    label: "Medication guidance"
  },
  {
    id: "conn-4",
    source: "literature-4",
    target: "case-103", // Anxiety case
    label: "Treatment option"
  },
  {
    id: "conn-5",
    source: "literature-5",
    target: "case-104", // Schizophrenia case
    label: "Treatment protocol"
  }
];

// Enhanced literature node factory
export const createLiteratureNode = (data) => ({
  ...data,
  label: data.title || 'Literature Item',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});
