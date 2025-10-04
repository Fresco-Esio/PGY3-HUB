import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Users,
  Download,
  FileDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const ImportSpreadsheetModal = ({
  isOpen,
  onClose,
  onImport,
  addToast,
}) => {
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview
  const fileInputRef = useRef(null);

  // Required fields for patient nodes
  const REQUIRED_FIELDS = ['firstName', 'lastName', 'chiefComplaint'];
  
  // Expected column headers (case-insensitive matching)
  const EXPECTED_HEADERS = {
    'first name': 'firstName',
    'firstname': 'firstName',
    'last name': 'lastName',
    'lastname': 'lastName',
    'chief complaint': 'chiefComplaint',
    'chiefcomplaint': 'chiefComplaint',
    'complaint': 'chiefComplaint',
    // Optional fields
    'initial presentation': 'initialPresentation',
    'initialpresentation': 'initialPresentation',
    'presentation': 'initialPresentation',
    'narrative': 'narrativeSummary',
    'narrative summary': 'narrativeSummary',
    'status': 'status',
  };

  const resetModal = useCallback(() => {
    setFile(null);
    setParsedData([]);
    setValidationResults([]);
    setStep(1);
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  // Parse CSV file
  const parseCSV = useCallback((fileContent) => {
    return new Promise((resolve, reject) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error('CSV parsing failed: ' + results.errors[0].message));
          } else {
            resolve(results.data);
          }
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }, []);

  // Parse Excel file
  const parseExcel = useCallback((fileBuffer) => {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      return data;
    } catch (error) {
      throw new Error('Excel parsing failed: ' + error.message);
    }
  }, []);

  // Normalize column headers to match expected fields
  const normalizeData = useCallback((data) => {
    return data.map((row, index) => {
      const normalized = {};
      
      Object.keys(row).forEach((key) => {
        const normalizedKey = key.toLowerCase().trim();
        const mappedField = EXPECTED_HEADERS[normalizedKey];
        
        if (mappedField) {
          normalized[mappedField] = String(row[key] || '').trim();
        }
      });

      return {
        ...normalized,
        _originalIndex: index,
      };
    });
  }, []);

  // Validate parsed data
  const validateData = useCallback((data) => {
    return data.map((row, index) => {
      const missingFields = REQUIRED_FIELDS.filter(
        (field) => !row[field] || row[field].trim() === ''
      );

      return {
        index,
        row,
        isValid: missingFields.length === 0,
        missingFields,
        warnings: [],
      };
    });
  }, []);

  // Process uploaded file
  const processFile = useCallback(async (uploadedFile) => {
    setIsProcessing(true);
    
    try {
      const fileName = uploadedFile.name.toLowerCase();
      let data = [];

      if (fileName.endsWith('.csv')) {
        // Parse CSV
        const fileContent = await uploadedFile.text();
        data = await parseCSV(fileContent);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Parse Excel
        const fileBuffer = await uploadedFile.arrayBuffer();
        data = parseExcel(fileBuffer);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or Excel file.');
      }

      if (!data || data.length === 0) {
        throw new Error('The file appears to be empty or has no valid data.');
      }

      // Normalize column headers
      const normalizedData = normalizeData(data);

      // Validate data
      const validation = validateData(normalizedData);

      setParsedData(normalizedData);
      setValidationResults(validation);
      setStep(2);

      const validCount = validation.filter((v) => v.isValid).length;
      const invalidCount = validation.length - validCount;

      if (invalidCount > 0) {
        addToast(
          `Parsed ${validation.length} rows: ${validCount} valid, ${invalidCount} with missing fields`,
          'info'
        );
      } else {
        addToast(`Successfully parsed ${validCount} valid patient records`, 'success');
      }
    } catch (error) {
      console.error('File processing error:', error);
      addToast(error.message || 'Failed to process file', 'error');
      resetModal();
    } finally {
      setIsProcessing(false);
    }
  }, [parseCSV, parseExcel, normalizeData, validateData, addToast, resetModal]);

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  }, [processFile]);

  // Handle drag and drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      processFile(droppedFile);
    }
  }, [processFile]);

  // Handle import confirmation
  const handleImportConfirm = useCallback(() => {
    const validRows = validationResults.filter((v) => v.isValid);
    const invalidRows = validationResults.filter((v) => !v.isValid);

    if (validRows.length === 0) {
      addToast('No valid patient records to import', 'error');
      return;
    }

    // Create patient case data
    const patientCases = validRows.map((validation) => {
      const row = validation.row;
      const fullName = `${row.firstName} ${row.lastName}`.trim();
      
      return {
        id: Date.now() + Math.random(), // Temporary unique ID
        label: fullName,
        firstName: row.firstName,
        lastName: row.lastName,
        chief_complaint: row.chiefComplaint,
        chiefComplaint: row.chiefComplaint,
        initial_presentation: row.initialPresentation || '',
        initialPresentation: row.initialPresentation || '',
        narrative_summary: row.narrativeSummary || '',
        status: row.status || 'active',
        medications: [],
        timeline: [],
        last_updated: new Date().toISOString(),
        _hasIncompleteData: false, // All valid rows are complete
      };
    });

    // Create patient cases with missing data (for highlighting)
    const incompleteCases = invalidRows.map((validation) => {
      const row = validation.row;
      const fullName = `${row.firstName || 'Unknown'} ${row.lastName || 'Patient'}`.trim();
      
      return {
        id: Date.now() + Math.random(),
        label: fullName,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        chief_complaint: row.chiefComplaint || '',
        chiefComplaint: row.chiefComplaint || '',
        initial_presentation: row.initialPresentation || '',
        initialPresentation: row.initialPresentation || '',
        narrative_summary: row.narrativeSummary || '',
        status: row.status || 'active',
        medications: [],
        timeline: [],
        last_updated: new Date().toISOString(),
        _hasIncompleteData: true,
        _missingFields: validation.missingFields,
      };
    });

    const allCases = [...patientCases, ...incompleteCases];

    // Call import handler
    onImport(allCases, {
      totalRows: validationResults.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
    });

    // Show summary toast
    if (invalidRows.length > 0) {
      addToast(
        `Imported ${validRows.length} complete and ${invalidRows.length} incomplete patient records`,
        'info'
      );
    } else {
      addToast(`Successfully imported ${validRows.length} patient records`, 'success');
    }

    handleClose();
  }, [validationResults, onImport, addToast, handleClose]);

  // Download sample CSV template
  const downloadSampleCSV = useCallback(() => {
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Chief Complaint': 'Persistent sadness and loss of interest in activities',
        'Initial Presentation': 'Patient presents with 3-month history of depressed mood',
        'Narrative Summary': 'Patient is a 35-year-old male with major depressive disorder',
        'Status': 'active',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Chief Complaint': 'Anxiety and panic attacks',
        'Initial Presentation': 'Patient reports increasing anxiety over past 6 months',
        'Narrative Summary': 'Patient is a 28-year-old female with generalized anxiety disorder',
        'Status': 'active',
      },
      {
        'First Name': 'Michael',
        'Last Name': 'Johnson',
        'Chief Complaint': 'Sleep disturbances and racing thoughts',
        'Initial Presentation': 'Patient describes alternating periods of high and low mood',
        'Narrative Summary': 'Patient is a 42-year-old male with bipolar disorder',
        'Status': 'follow_up',
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'patient_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('Sample CSV template downloaded', 'success');
  }, [addToast]);

  // Download sample Excel template
  const downloadSampleExcel = useCallback(() => {
    const sampleData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Chief Complaint': 'Persistent sadness and loss of interest in activities',
        'Initial Presentation': 'Patient presents with 3-month history of depressed mood',
        'Narrative Summary': 'Patient is a 35-year-old male with major depressive disorder',
        'Status': 'active',
      },
      {
        'First Name': 'Jane',
        'Last Name': 'Smith',
        'Chief Complaint': 'Anxiety and panic attacks',
        'Initial Presentation': 'Patient reports increasing anxiety over past 6 months',
        'Narrative Summary': 'Patient is a 28-year-old female with generalized anxiety disorder',
        'Status': 'active',
      },
      {
        'First Name': 'Michael',
        'Last Name': 'Johnson',
        'Chief Complaint': 'Sleep disturbances and racing thoughts',
        'Initial Presentation': 'Patient describes alternating periods of high and low mood',
        'Narrative Summary': 'Patient is a 42-year-old male with bipolar disorder',
        'Status': 'follow_up',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');
    
    XLSX.writeFile(workbook, 'patient_import_template.xlsx');
    
    addToast('Sample Excel template downloaded', 'success');
  }, [addToast]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={24} />
              <h2 className="text-xl font-semibold">
                {step === 1 ? 'Import Patient Records' : 'Preview & Confirm'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-indigo-200 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {step === 1 ? (
              // Step 1: Upload
              <div className="space-y-6">
                {/* Download Templates Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Download size={16} />
                    Download Sample Templates
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Download a pre-formatted template to ensure your data is structured correctly.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadSampleCSV}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <FileDown size={16} />
                      CSV Template
                    </button>
                    <button
                      onClick={downloadSampleExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      <FileDown size={16} />
                      Excel Template
                    </button>
                  </div>
                </div>

                {/* Required Fields Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-amber-900 mb-2">
                    Required Fields
                  </h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• <strong>First Name</strong> - Patient's first name</li>
                    <li>• <strong>Last Name</strong> - Patient's last name</li>
                    <li>• <strong>Chief Complaint</strong> - Primary presenting concern</li>
                  </ul>
                  <p className="text-xs text-amber-700 mt-2">
                    Optional fields: Initial Presentation, Narrative Summary, Status
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                >
                  <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {isDragging ? 'Drop file here' : 'Upload Spreadsheet'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Processing...' : 'Choose File'}
                  </button>
                  <p className="text-xs text-gray-500 mt-3">
                    Supported formats: CSV, XLSX, XLS
                  </p>
                </div>
              </div>
            ) : (
              // Step 2: Preview
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-slate-100 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Import Summary
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Total Rows:</span>
                      <span className="ml-2 font-semibold text-slate-900">
                        {validationResults.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Valid:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {validationResults.filter((v) => v.isValid).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600">Missing Data:</span>
                      <span className="ml-2 font-semibold text-amber-600">
                        {validationResults.filter((v) => !v.isValid).length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700 text-white sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left w-12">#</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-left">First Name</th>
                          <th className="px-4 py-2 text-left">Last Name</th>
                          <th className="px-4 py-2 text-left">Chief Complaint</th>
                          <th className="px-4 py-2 text-left">Issues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResults.map((validation, idx) => (
                          <tr
                            key={idx}
                            className={`border-b ${
                              validation.isValid
                                ? 'bg-white hover:bg-green-50'
                                : 'bg-amber-50 hover:bg-amber-100'
                            }`}
                          >
                            <td className="px-4 py-2 text-gray-600">{idx + 1}</td>
                            <td className="px-4 py-2">
                              {validation.isValid ? (
                                <CheckCircle
                                  size={16}
                                  className="text-green-600"
                                  title="Valid"
                                />
                              ) : (
                                <AlertCircle
                                  size={16}
                                  className="text-amber-600"
                                  title="Missing required fields"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {validation.row.firstName || (
                                <span className="text-red-500 italic">Missing</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {validation.row.lastName || (
                                <span className="text-red-500 italic">Missing</span>
                              )}
                            </td>
                            <td className="px-4 py-2 max-w-xs truncate">
                              {validation.row.chiefComplaint || (
                                <span className="text-red-500 italic">Missing</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {validation.missingFields.length > 0 && (
                                <span className="text-xs text-amber-700">
                                  Missing: {validation.missingFields.join(', ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Warning if there are invalid rows */}
                {validationResults.some((v) => !v.isValid) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-900 mb-1">
                          Some records have missing required fields
                        </h4>
                        <p className="text-sm text-amber-800">
                          These records will still be imported but will be highlighted on the mind map
                          for you to complete the missing information.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
            )}
            {step === 1 && <div />}
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              {step === 2 && (
                <button
                  onClick={handleImportConfirm}
                  disabled={validationResults.length === 0}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Users size={16} />
                  Import {validationResults.filter((v) => v.isValid).length} Patient
                  {validationResults.filter((v) => v.isValid).length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImportSpreadsheetModal;
