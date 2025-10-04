# Spreadsheet Import Feature - Documentation

## Overview
The PGY3-HUB Mind Map application now supports bulk import of patient records from CSV and Excel spreadsheets. This feature allows psychiatry residents to quickly populate their mind map with multiple patient cases without manual entry.

## Features

### 1. File Format Support
- **CSV files** (.csv)
- **Excel files** (.xlsx, .xls)

### 2. Upload Methods
- **File Upload Button**: Click to browse and select files
- **Drag & Drop**: Drag files directly into the upload zone

### 3. Required Fields
The import feature requires three essential fields for each patient record:
- **First Name**: Patient's first name
- **Last Name**: Patient's last name  
- **Chief Complaint**: Primary presenting concern or symptoms

### 4. Optional Fields
Additional fields that can be included:
- **Initial Presentation**: Initial clinical presentation details
- **Narrative Summary**: Comprehensive case narrative
- **Status**: Case status (active, archived, follow_up, completed)

### 5. Column Header Mapping
The import system automatically recognizes various column header formats (case-insensitive):

| Field | Accepted Headers |
|-------|-----------------|
| First Name | "First Name", "firstname", "FirstName" |
| Last Name | "Last Name", "lastname", "LastName" |
| Chief Complaint | "Chief Complaint", "chiefcomplaint", "complaint" |
| Initial Presentation | "Initial Presentation", "initialpresentation", "presentation" |
| Narrative Summary | "Narrative", "narrative summary" |
| Status | "Status" |

## How to Use

### Step 1: Access Import Feature
1. Open your mind map
2. Click the **"Import Patients"** button in the left sidebar (teal colored button)

### Step 2: Download Template (Optional)
- Click **"CSV Template"** to download a sample CSV file
- Click **"Excel Template"** to download a sample Excel file
- Templates include example data showing the correct format

### Step 3: Upload Your Spreadsheet
Choose one of two methods:
- **Click "Choose File"** to browse for your file
- **Drag and drop** your file into the upload zone

### Step 4: Preview Data
- Review the parsed data in the preview table
- Check validation status for each record
- See summary of valid and incomplete records

### Step 5: Confirm Import
- Click **"Import X Patients"** to create the nodes
- Nodes will be automatically positioned on the mind map
- Incomplete nodes will be highlighted with an amber indicator

## Data Validation

### Valid Records
Records with all required fields (First Name, Last Name, Chief Complaint) are marked as valid with a green checkmark ✓

### Incomplete Records  
Records missing one or more required fields:
- Marked with an amber warning icon ⚠️
- Still imported but highlighted on the mind map
- Visual amber pulse animation on the node
- Amber badge showing which fields are missing
- Can be completed by editing the node after import

### Missing Field Handling
- **Missing First Name**: Node will be labeled with "Unknown [Last Name]"
- **Missing Last Name**: Node will be labeled with "[First Name] Patient"
- **Missing Chief Complaint**: Field will be empty, can be added later
- All incomplete nodes are visually distinct for easy identification

## Sample Files

### Test Files Included
1. **test_patient_import.csv** - CSV file with mix of complete and incomplete records
2. **test_patient_import.xlsx** - Excel file with sample patient data

### Sample Data Format
```csv
First Name,Last Name,Chief Complaint,Initial Presentation,Narrative Summary,Status
John,Doe,"Persistent sadness and loss of interest","Patient presents with 3-month history of depressed mood","35-year-old male with major depressive disorder",active
Jane,Smith,"Anxiety and panic attacks","Patient reports increasing anxiety over 6 months","28-year-old female with generalized anxiety disorder",active
```

## Visual Indicators

### Complete Patient Nodes
- Standard violet/purple gradient styling
- Normal border and shadow
- No warning indicators

### Incomplete Patient Nodes
- Amber pulsing border animation
- Amber warning badge in top corner
- Hover tooltip shows missing fields
- Can be edited normally to complete information

## Technical Details

### Node Positioning
- Imported nodes are automatically positioned in a grid layout
- Spacing is maintained to prevent overlapping
- Position starts after existing nodes
- 280px horizontal and vertical spacing

### Data Structure
Patient nodes include:
```javascript
{
  id: unique_timestamp,
  label: "First Last",
  firstName: "First",
  lastName: "Last", 
  chief_complaint: "Complaint text",
  chiefComplaint: "Complaint text",
  initial_presentation: "Presentation text",
  narrative_summary: "Narrative text",
  status: "active",
  medications: [],
  timeline: [],
  _hasIncompleteData: true/false,
  _missingFields: ["field1", "field2"]
}
```

## Tips & Best Practices

1. **Use Templates**: Download the sample templates to ensure correct formatting
2. **Check Data**: Preview your data before importing to catch any issues
3. **Complete Later**: Don't worry about incomplete records - they can be edited after import
4. **Backup First**: Consider exporting your current mind map before large imports
5. **Consistent Format**: Keep column headers consistent across imports
6. **Test Small**: Try importing a few records first before bulk import

## Troubleshooting

### File Won't Upload
- Ensure file is in CSV or Excel format (.csv, .xlsx, .xls)
- Check that file is not corrupted
- Verify file size is reasonable (< 5MB recommended)

### No Data Showing
- Check that your spreadsheet has a header row
- Verify column headers match expected formats
- Ensure there's data in the rows below headers

### Missing Fields Warning
- Review the preview table to see which fields are missing
- You can still import and complete the data later
- Or cancel, fix the spreadsheet, and re-import

### Nodes Not Appearing
- Check browser console for errors
- Refresh the page and try again
- Verify the mind map is not at maximum capacity

## Future Enhancements

Potential future additions:
- Export existing patient nodes to spreadsheet
- Bulk edit via spreadsheet re-import
- Support for additional fields (medications, diagnoses, etc.)
- Import with automatic node connections
- Template customization options

## Support

For issues or questions:
1. Check this documentation
2. Review the sample files
3. Contact development team
4. Report bugs through issue tracker
