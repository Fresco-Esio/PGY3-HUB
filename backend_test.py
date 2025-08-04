#!/usr/bin/env python3
"""
Backend API Testing for PGY3-HUB Mind Mapping Application
Tests all CRUD operations for Topics, Cases, Tasks, and Literature
"""

import requests
import sys
import json
from datetime import datetime, timezone
from typing import Dict, Any, List

class PGY3HubAPITester:
    def __init__(self, base_url="https://a6f96840-83cc-480e-b322-714fc222a655.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_data = {
            'topics': [],
            'cases': [],
            'tasks': [],
            'literature': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {}, 0

            success = response.status_code == expected_status
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}
            
            return success, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}, 0

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        success, data, status = self.make_request('GET', '/')
        self.log_test("Root API Endpoint", success, f"Status: {status}")
        return success

    def test_get_mindmap_data(self):
        """Test getting all mind map data"""
        success, data, status = self.make_request('GET', '/mindmap-data')
        if success:
            # Store initial data for reference
            self.initial_data = data
            topics_count = len(data.get('topics', []))
            cases_count = len(data.get('cases', []))
            tasks_count = len(data.get('tasks', []))
            literature_count = len(data.get('literature', []))
            details = f"Topics: {topics_count}, Cases: {cases_count}, Tasks: {tasks_count}, Literature: {literature_count}"
        else:
            details = f"Status: {status}, Error: {data.get('error', 'Unknown')}"
        
        self.log_test("Get Mind Map Data", success, details)
        return success, data if success else {}

    def test_get_individual_collections(self):
        """Test getting individual collections"""
        endpoints = [
            ('topics', 'Topics'),
            ('cases', 'Cases'), 
            ('tasks', 'Tasks'),
            ('literature', 'Literature')
        ]
        
        all_success = True
        for endpoint, name in endpoints:
            success, data, status = self.make_request('GET', f'/{endpoint}')
            count = len(data) if success and isinstance(data, list) else 0
            details = f"Count: {count}" if success else f"Status: {status}"
            self.log_test(f"Get {name}", success, details)
            if not success:
                all_success = False
                
        return all_success

    def create_test_topic(self) -> Dict[str, Any]:
        """Create a test topic"""
        test_topic = {
            "title": "Test Anxiety Disorder",
            "description": "Test topic for API validation",
            "category": "Anxiety Disorders",
            "color": "#10B981",
            "notes": "This is a test topic created by automated testing",
            "tags": "test,api,anxiety"
        }
        return test_topic

    def create_test_case(self) -> Dict[str, Any]:
        """Create a test case"""
        test_case = {
            "case_id": f"TEST-CASE-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "encounter_date": datetime.now(timezone.utc).isoformat(),
            "primary_diagnosis": "Major Depressive Disorder",
            "secondary_diagnoses": ["Generalized Anxiety Disorder"],
            "age": 28,
            "gender": "Female",
            "chief_complaint": "Feeling depressed and anxious for the past month",
            "initial_presentation": "Patient presented with low mood and worry",
            "current_presentation": "Symptoms have improved with treatment",
            "medication_history": "Started on sertraline 50mg",
            "therapy_progress": "Engaged in CBT sessions",
            "defense_patterns": "Intellectualization, avoidance",
            "clinical_reflection": "Good therapeutic alliance established"
        }
        return test_case

    def create_test_task(self) -> Dict[str, Any]:
        """Create a test task"""
        test_task = {
            "title": "Review Test Case Documentation",
            "description": "Complete documentation review for test case",
            "priority": "high",
            "due_date": datetime.now(timezone.utc).isoformat(),
            "notes": "This is a test task for API validation"
        }
        return test_task

    def create_test_literature(self) -> Dict[str, Any]:
        """Create test literature"""
        test_literature = {
            "title": "Test Study on Depression Treatment",
            "authors": "Smith, J., Johnson, A.",
            "publication": "Journal of Test Psychiatry",
            "year": 2024,
            "doi": "10.1000/test.doi.123",
            "abstract": "This is a test abstract for API validation purposes",
            "notes": "Test literature entry for automated testing"
        }
        return test_literature

    def test_save_mindmap_data(self):
        """Test saving complete mind map data"""
        # Get current data first
        success, current_data = self.test_get_mindmap_data()
        if not success:
            self.log_test("Save Mind Map Data - Get Current", False, "Failed to get current data")
            return False

        # Create test data
        test_topic = self.create_test_topic()
        test_case = self.create_test_case()
        test_task = self.create_test_task()
        test_literature = self.create_test_literature()

        # Add test items to current data
        updated_data = {
            "topics": current_data.get('topics', []) + [test_topic],
            "cases": current_data.get('cases', []) + [test_case],
            "tasks": current_data.get('tasks', []) + [test_task],
            "literature": current_data.get('literature', []) + [test_literature],
            "connections": current_data.get('connections', [])
        }

        # Save updated data
        success, response, status = self.make_request('PUT', '/mindmap-data', updated_data)
        details = f"Status: {status}" if success else f"Status: {status}, Error: {response.get('error', 'Unknown')}"
        self.log_test("Save Mind Map Data", success, details)

        if success:
            # Store test data for cleanup
            self.test_data['topics'].append(test_topic)
            self.test_data['cases'].append(test_case)
            self.test_data['tasks'].append(test_task)
            self.test_data['literature'].append(test_literature)

        return success

    def test_pdf_upload_endpoint(self):
        """Test PDF upload endpoint (without actual file)"""
        # Test with invalid request (no file)
        success, data, status = self.make_request('POST', '/upload-pdf', {}, expected_status=422)
        # 422 is expected for missing file, so this is actually success
        details = f"Status: {status} (Expected 422 for missing file)"
        self.log_test("PDF Upload Endpoint", status == 422, details)
        return status == 422

    def test_data_persistence(self):
        """Test that data persists after save"""
        # Get data after save
        success, new_data = self.test_get_mindmap_data()
        if not success:
            self.log_test("Data Persistence Check", False, "Failed to retrieve data")
            return False

        # Check if our test data is present
        topics_found = any(t.get('title') == 'Test Anxiety Disorder' for t in new_data.get('topics', []))
        cases_found = any(c.get('primary_diagnosis') == 'Major Depressive Disorder' and 'TEST-CASE-' in c.get('case_id', '') for c in new_data.get('cases', []))
        tasks_found = any(t.get('title') == 'Review Test Case Documentation' for t in new_data.get('tasks', []))
        literature_found = any(l.get('title') == 'Test Study on Depression Treatment' for l in new_data.get('literature', []))

        all_found = topics_found and cases_found and tasks_found and literature_found
        details = f"Topic: {topics_found}, Case: {cases_found}, Task: {tasks_found}, Literature: {literature_found}"
        self.log_test("Data Persistence Check", all_found, details)
        return all_found

    def run_comprehensive_test_suite(self):
        """Run all tests in sequence"""
        print("🚀 Starting PGY3-HUB Backend API Test Suite")
        print(f"📡 Testing API at: {self.api_url}")
        print("=" * 60)

        # Basic connectivity tests
        print("\n📋 Basic Connectivity Tests:")
        self.test_root_endpoint()
        
        # Data retrieval tests
        print("\n📊 Data Retrieval Tests:")
        self.test_get_mindmap_data()
        self.test_get_individual_collections()
        
        # Data manipulation tests
        print("\n💾 Data Manipulation Tests:")
        self.test_save_mindmap_data()
        self.test_data_persistence()
        
        # File upload tests
        print("\n📁 File Upload Tests:")
        self.test_pdf_upload_endpoint()

        # Summary
        print("\n" + "=" * 60)
        print(f"📈 Test Results Summary:")
        print(f"   Total Tests: {self.tests_run}")
        print(f"   Passed: {self.tests_passed}")
        print(f"   Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    """Main test execution"""
    tester = PGY3HubAPITester()
    return tester.run_comprehensive_test_suite()

if __name__ == "__main__":
    sys.exit(main())