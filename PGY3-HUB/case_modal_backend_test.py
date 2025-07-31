#!/usr/bin/env python3
"""
Comprehensive Backend API Test for CaseModal functionality
Tests all CRUD operations for patient cases and related data
"""

import requests
import json
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List

class CaseModalBackendTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_case_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED {details}")
        else:
            print(f"❌ {test_name}: FAILED {details}")
        return success
    
    def test_api_health(self) -> bool:
        """Test if API is accessible"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            return self.log_test(
                "API Health Check", 
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
        except Exception as e:
            return self.log_test("API Health Check", False, f"Error: {str(e)}")
    
    def test_get_mindmap_data(self) -> Dict[str, Any]:
        """Test getting mind map data"""
        try:
            response = requests.get(f"{self.api_url}/mindmap-data", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                cases_count = len(data.get('cases', []))
                self.log_test(
                    "Get Mind Map Data", 
                    True, 
                    f"Found {cases_count} existing cases"
                )
                return data
            else:
                self.log_test("Get Mind Map Data", False, f"Status: {response.status_code}")
                return {}
        except Exception as e:
            self.log_test("Get Mind Map Data", False, f"Error: {str(e)}")
            return {}
    
    def test_create_case(self, mindmap_data: Dict[str, Any]) -> bool:
        """Test creating a new patient case"""
        try:
            # Create a test case with all the fields needed for CaseModal
            test_case = {
                "case_id": f"TEST-CASE-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                "encounter_date": datetime.now().isoformat(),
                "primary_diagnosis": "Major Depressive Disorder, Severe",
                "secondary_diagnoses": ["Generalized Anxiety Disorder"],
                "age": 28,
                "gender": "Female",
                "chief_complaint": "I can't get out of bed and feel hopeless",
                "initial_presentation": "28-year-old female presenting with 3-month history of worsening depression, sleep disturbances, and social withdrawal",
                "current_presentation": "Patient shows some improvement with medication but still struggling with motivation",
                "medication_history": "Started on Sertraline 50mg, increased to 100mg after 4 weeks",
                "therapy_progress": "Engaged in CBT, working on cognitive restructuring and behavioral activation",
                "defense_patterns": "Tends to use intellectualization and minimization when discussing emotions",
                "clinical_reflection": "Consider adding mood stabilizer if current regimen insufficient",
                "history_present_illness": "Gradual onset following job loss, no prior psychiatric history",
                "medical_history": "No significant medical history",
                "medications": ["Sertraline 100mg daily"],
                "mental_status_exam": "Depressed mood, congruent affect, no SI/HI, good insight",
                "assessment_plan": "Continue current medication, increase therapy frequency",
                "notes": "Strong family support system, good therapeutic alliance",
                "status": "active",
                "linked_topics": [],
                "timeline": [],
                # New fields for CaseModal
                "narrative_summary": "This case demonstrates the complexity of treating major depression in young adults, particularly following significant life stressors.",
                "therapeutic_highlights": "Key breakthrough occurred in session 6 when patient was able to connect childhood experiences to current coping patterns.",
                "position": {"x": 100, "y": 100}
            }
            
            # Add the new case to existing data
            updated_data = mindmap_data.copy()
            updated_data['cases'] = updated_data.get('cases', []) + [test_case]
            
            response = requests.put(
                f"{self.api_url}/mindmap-data", 
                json=updated_data,
                timeout=10
            )
            
            success = response.status_code == 200
            if success:
                self.test_case_id = test_case['case_id']
                
            return self.log_test(
                "Create Test Case", 
                success,
                f"Case ID: {test_case['case_id']}" if success else f"Status: {response.status_code}"
            )
            
        except Exception as e:
            return self.log_test("Create Test Case", False, f"Error: {str(e)}")
    
    def test_get_cases(self) -> List[Dict[str, Any]]:
        """Test getting all cases"""
        try:
            response = requests.get(f"{self.api_url}/cases", timeout=10)
            success = response.status_code == 200
            
            if success:
                cases = response.json()
                test_case_found = any(case.get('case_id') == self.test_case_id for case in cases)
                self.log_test(
                    "Get All Cases", 
                    True, 
                    f"Found {len(cases)} cases, test case present: {test_case_found}"
                )
                return cases
            else:
                self.log_test("Get All Cases", False, f"Status: {response.status_code}")
                return []
        except Exception as e:
            self.log_test("Get All Cases", False, f"Error: {str(e)}")
            return []
    
    def test_update_case_with_medications(self, mindmap_data: Dict[str, Any]) -> bool:
        """Test updating a case with medication data (for Medications tab)"""
        try:
            # Find our test case and add medications
            cases = mindmap_data.get('cases', [])
            test_case = None
            for case in cases:
                if case.get('case_id') == self.test_case_id:
                    test_case = case
                    break
            
            if not test_case:
                return self.log_test("Update Case with Medications", False, "Test case not found")
            
            # Add medications data for testing the Medications tab
            test_case['medications'] = [
                {
                    "id": 1,
                    "name": "Sertraline",
                    "dosage": "100mg",
                    "frequency": "Once daily",
                    "effect": "Improved mood, reduced anxiety",
                    "dateAdded": datetime.now().isoformat()
                },
                {
                    "id": 2,
                    "name": "Trazodone",
                    "dosage": "50mg",
                    "frequency": "At bedtime",
                    "effect": "Better sleep quality",
                    "dateAdded": (datetime.now() - timedelta(days=7)).isoformat()
                }
            ]
            
            # Update narrative and therapeutic highlights
            test_case['narrative_summary'] = "Updated narrative: Patient showing gradual improvement with combined pharmacological and psychotherapeutic approach. Key themes include processing grief related to job loss and rebuilding sense of self-worth."
            test_case['therapeutic_highlights'] = "Session 8 breakthrough: Patient made connection between perfectionist tendencies and depression. Homework assignment of 'good enough' activities showing positive results. Working on self-compassion exercises."
            
            response = requests.put(
                f"{self.api_url}/mindmap-data", 
                json=mindmap_data,
                timeout=10
            )
            
            success = response.status_code == 200
            return self.log_test(
                "Update Case with Medications", 
                success,
                f"Added {len(test_case['medications'])} medications" if success else f"Status: {response.status_code}"
            )
            
        except Exception as e:
            return self.log_test("Update Case with Medications", False, f"Error: {str(e)}")
    
    def test_case_data_persistence(self) -> bool:
        """Test that case data persists correctly"""
        try:
            # Get fresh data and verify our test case has all the expected fields
            response = requests.get(f"{self.api_url}/mindmap-data", timeout=10)
            if response.status_code != 200:
                return self.log_test("Case Data Persistence", False, f"Failed to fetch data: {response.status_code}")
            
            data = response.json()
            cases = data.get('cases', [])
            test_case = None
            
            for case in cases:
                if case.get('case_id') == self.test_case_id:
                    test_case = case
                    break
            
            if not test_case:
                return self.log_test("Case Data Persistence", False, "Test case not found in data")
            
            # Check for key fields needed by CaseModal tabs
            required_fields = [
                'case_id', 'primary_diagnosis', 'chief_complaint', 'initial_presentation',
                'narrative_summary', 'medications', 'therapeutic_highlights'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in test_case or test_case[field] is None:
                    missing_fields.append(field)
            
            # Check medications structure
            medications = test_case.get('medications', [])
            medications_valid = True
            if medications:
                for med in medications:
                    required_med_fields = ['name', 'dosage', 'frequency', 'effect']
                    for med_field in required_med_fields:
                        if med_field not in med:
                            medications_valid = False
                            missing_fields.append(f"medication.{med_field}")
            
            success = len(missing_fields) == 0 and medications_valid
            details = f"All fields present, {len(medications)} medications" if success else f"Missing: {missing_fields}"
            
            return self.log_test("Case Data Persistence", success, details)
            
        except Exception as e:
            return self.log_test("Case Data Persistence", False, f"Error: {str(e)}")
    
    def test_delete_test_case(self, mindmap_data: Dict[str, Any]) -> bool:
        """Clean up by deleting the test case"""
        try:
            # Remove our test case from the data
            cases = mindmap_data.get('cases', [])
            original_count = len(cases)
            updated_cases = [case for case in cases if case.get('case_id') != self.test_case_id]
            
            if len(updated_cases) == original_count:
                return self.log_test("Delete Test Case", False, "Test case not found for deletion")
            
            mindmap_data['cases'] = updated_cases
            
            response = requests.put(
                f"{self.api_url}/mindmap-data", 
                json=mindmap_data,
                timeout=10
            )
            
            success = response.status_code == 200
            return self.log_test(
                "Delete Test Case", 
                success,
                f"Removed test case" if success else f"Status: {response.status_code}"
            )
            
        except Exception as e:
            return self.log_test("Delete Test Case", False, f"Error: {str(e)}")
    
    def run_all_tests(self) -> bool:
        """Run all backend tests for CaseModal functionality"""
        print("🧪 Starting CaseModal Backend API Tests...")
        print("=" * 60)
        
        # Test 1: API Health
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Test 2: Get initial data
        mindmap_data = self.test_get_mindmap_data()
        if not mindmap_data:
            print("❌ Cannot get mind map data. Stopping tests.")
            return False
        
        # Test 3: Create test case
        if not self.test_create_case(mindmap_data):
            print("❌ Cannot create test case. Stopping tests.")
            return False
        
        # Refresh data after creation
        mindmap_data = self.test_get_mindmap_data()
        
        # Test 4: Get all cases
        cases = self.test_get_cases()
        
        # Test 5: Update case with medications and other data
        if not self.test_update_case_with_medications(mindmap_data):
            print("⚠️  Case update failed, but continuing tests...")
        
        # Refresh data after update
        mindmap_data = self.test_get_mindmap_data()
        
        # Test 6: Verify data persistence
        self.test_case_data_persistence()
        
        # Test 7: Clean up
        self.test_delete_test_case(mindmap_data)
        
        # Summary
        print("=" * 60)
        print(f"🏁 Backend Tests Complete: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("✅ All backend tests passed! API is ready for CaseModal testing.")
            return True
        else:
            print(f"❌ {self.tests_run - self.tests_passed} tests failed. Check API implementation.")
            return False

def main():
    # Use the public URL from environment
    backend_url = "https://336d4c80-d84e-4815-a915-e2ffd980488a.preview.emergentagent.com"
    
    print(f"Testing backend at: {backend_url}")
    
    tester = CaseModalBackendTester(backend_url)
    success = tester.run_all_tests()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())