# Spreadsheet Import Feature - Testing Checklist

## Pre-Testing Setup
- [x] Libraries installed (xlsx, papaparse)
- [x] ImportSpreadsheetModal component created
- [x] Import button added to sidebar
- [x] Sample CSV and Excel files created
- [x] CSS styling for incomplete nodes added
- [x] Visual indicators implemented

## Feature Testing

### 1. UI/UX Testing
- [ ] Import button is visible in sidebar (teal colored)
- [ ] Import button opens modal when clicked
- [ ] Modal has proper styling and animations
- [ ] Download template buttons are present
- [ ] File upload button is functional
- [ ] Drag and drop zone is highlighted on hover

### 2. File Upload Testing

#### CSV Upload
- [ ] Can select CSV file using file browser
- [ ] Can drag and drop CSV file
- [ ] CSV file is parsed correctly
- [ ] Column headers are recognized (case-insensitive)
- [ ] Data is displayed in preview table

#### Excel Upload
- [ ] Can select Excel file using file browser
- [ ] Can drag and drop Excel file
- [ ] Excel file is parsed correctly
- [ ] Column headers are recognized
- [ ] Data is displayed in preview table

### 3. Template Download Testing
- [ ] CSV template downloads successfully
- [ ] CSV template has correct structure
- [ ] CSV template includes sample data
- [ ] Excel template downloads successfully
- [ ] Excel template has correct structure
- [ ] Excel template includes sample data

### 4. Data Validation Testing

#### Complete Records
- [ ] Records with all required fields show green checkmark
- [ ] Valid count is accurate in summary
- [ ] Complete records can be imported

#### Incomplete Records
- [ ] Records missing First Name show warning icon
- [ ] Records missing Last Name show warning icon
- [ ] Records missing Chief Complaint show warning icon
- [ ] Invalid count is accurate in summary
- [ ] Missing fields are listed in preview table
- [ ] Warning message displays for incomplete data

### 5. Import Process Testing

#### Successful Import
- [ ] Preview step shows correct data
- [ ] Import button shows correct patient count
- [ ] Import creates nodes on mind map
- [ ] Nodes are positioned in grid layout
- [ ] Nodes don't overlap
- [ ] Success toast notification appears

#### Complete Patient Nodes
- [ ] Nodes have correct names (First Last)
- [ ] Chief complaint is populated
- [ ] Optional fields are populated if provided
- [ ] Status is set correctly
- [ ] No incomplete indicators visible
- [ ] Can open and edit normally

#### Incomplete Patient Nodes
- [ ] Nodes are created even with missing data
- [ ] Amber warning badge is visible
- [ ] Amber pulsing border animation works
- [ ] Hover shows missing field tooltip
- [ ] Node can be opened for editing
- [ ] Missing fields can be filled in

### 6. Edge Cases Testing

#### Empty/Invalid Files
- [ ] Empty CSV shows appropriate error
- [ ] Empty Excel shows appropriate error
- [ ] Invalid file format shows error
- [ ] Corrupted file shows error

#### Special Characters
- [ ] Names with special characters import correctly
- [ ] Complaints with quotes import correctly
- [ ] Multi-line text is handled properly

#### Large Imports
- [ ] 10 patient records import successfully
- [ ] 50 patient records import successfully
- [ ] 100+ patient records handled gracefully

### 7. Integration Testing

#### With Existing Data
- [ ] Import adds to existing nodes
- [ ] Imported nodes positioned after existing ones
- [ ] No conflicts with existing node IDs
- [ ] Auto-save triggers after import

#### Node Functionality
- [ ] Imported nodes can be selected
- [ ] Imported nodes can be moved
- [ ] Imported nodes can be deleted
- [ ] Imported nodes can be edited
- [ ] Imported nodes can be connected
- [ ] Incomplete nodes can be completed

### 8. Performance Testing
- [ ] UI remains responsive during import
- [ ] Large files parse without freezing
- [ ] Preview table scrolls smoothly
- [ ] Animation doesn't lag
- [ ] No memory leaks detected

### 9. Browser Compatibility
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Safari
- [ ] Works in Edge

### 10. Error Handling
- [ ] Invalid file format shows clear error
- [ ] Network errors handled gracefully
- [ ] Parse errors show helpful message
- [ ] Can recover from errors and retry

## Test Files

### test_patient_import.csv
Contains 7 records:
- 4 complete records (all required fields)
- 1 missing last name (Sarah)
- 1 missing first name (Brown)
- 1 missing chief complaint (Emily Davis)

### test_patient_import.xlsx
Contains 5 complete records for basic testing

## Expected Results

### Import Summary for test_patient_import.csv
- Total Rows: 7
- Valid: 4
- Missing Data: 3

### Visual Result
- 4 normal violet nodes (complete)
- 3 nodes with amber warning badges (incomplete)
- All nodes positioned in grid
- Grid starts at x:400, y:150
- Spacing: 280px between nodes

## Bug Tracking

### Known Issues
- None currently

### Issues to Monitor
- Large file performance (>100 records)
- Special character handling in names
- Excel file format edge cases

## Success Criteria

✅ Feature is complete when:
1. All upload methods work (button and drag-drop)
2. Both CSV and Excel formats supported
3. Preview step shows accurate data
4. Validation correctly identifies missing fields
5. Complete and incomplete nodes created successfully
6. Incomplete nodes visually distinct
7. No runtime errors in console
8. Sample templates download correctly
9. Feature documented thoroughly
10. No breaking changes to existing functionality
