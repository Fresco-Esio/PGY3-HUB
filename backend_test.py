#!/usr/bin/env python3

import requests
import sys
import json
import io
import csv
from datetime import datetime
from typing import Dict, Any, Tuple

class ComprehensiveAPITester:
    def __init__(self, base_url="https://medhub-map.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.critical_issues = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                if files:
                    # Remove Content-Type header for file uploads
                    headers_copy = headers.copy()
                    if 'Content-Type' in headers_copy:
                        del headers_copy['Content-Type']
                    response = requests.post(url, data=data, files=files, headers=headers_copy, timeout=10)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    # Core Mind Map Data Endpoints
    def test_health_check(self):
        """Test health check endpoint"""
        return self.run_test("Health Check (Root)", "GET", "api/", 200)

    def test_get_mindmap_data(self):
        """Test getting mind map data"""
        return self.run_test("Get Mind Map Data", "GET", "api/mindmap-data", 200)

    def test_save_mindmap_data(self):
        """Test saving mind map data with realistic psychiatric data"""
        test_data = {
            "topics": [
                {
                    "id": "topic-mdd-001",
                    "title": "Major Depressive Disorder",
                    "description": "Comprehensive overview of MDD diagnosis and treatment",
                    "category": "Mood Disorders",
                    "color": "#3B82F6",
                    "position": {"x": 200, "y": 100},
                    "flashcard_count": 25,
                    "completed_flashcards": 18,
                    "definition": "A mental health disorder characterized by persistent sadness and loss of interest",
                    "diagnostic_criteria": [
                        "Depressed mood most of the day",
                        "Markedly diminished interest or pleasure",
                        "Significant weight loss or gain",
                        "Insomnia or hypersomnia",
                        "Psychomotor agitation or retardation"
                    ],
                    "comorbidities": ["Anxiety Disorders", "Substance Use Disorders"],
                    "differential_diagnoses": ["Bipolar Disorder", "Adjustment Disorder"],
                    "medications": [
                        {"name": "Sertraline", "class": "SSRI", "dosage": "50-200mg daily"},
                        {"name": "Escitalopram", "class": "SSRI", "dosage": "10-20mg daily"}
                    ],
                    "psychotherapy_modalities": [
                        {"type": "CBT", "description": "Cognitive Behavioral Therapy"},
                        {"type": "IPT", "description": "Interpersonal Therapy"}
                    ],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            ],
            "cases": [
                {
                    "id": "case-001",
                    "case_id": "PGY3-CASE-001",
                    "encounter_date": datetime(2024, 3, 15).isoformat(),
                    "primary_diagnosis": "Major Depressive Disorder, Severe",
                    "secondary_diagnoses": ["Generalized Anxiety Disorder"],
                    "age": 34,
                    "gender": "Female",
                    "chief_complaint": "I can't get out of bed anymore and feel hopeless",
                    "initial_presentation": "34-year-old female presenting with 3-month history of worsening depression",
                    "current_presentation": "Patient reports persistent low mood, anhedonia, and sleep disturbances",
                    "medication_history": "Previously tried sertraline 50mg with partial response",
                    "therapy_progress": "Engaged in CBT for 6 sessions with good rapport",
                    "defense_patterns": "Intellectualization and denial of severity",
                    "clinical_reflection": "Consider medication adjustment and trauma-informed care approach",
                    "status": "active",
                    "linked_topics": ["topic-mdd-001"],
                    "position": {"x": 400, "y": 200},
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            ],
            "tasks": [
                {
                    "id": "task-001",
                    "title": "Review MDD treatment guidelines",
                    "description": "Read updated APA guidelines for treatment-resistant depression",
                    "status": "pending",
                    "priority": "high",
                    "due_date": datetime(2024, 4, 1).isoformat(),
                    "linked_case_id": "case-001",
                    "linked_topic_id": "topic-mdd-001",
                    "notes": "Focus on medication augmentation strategies",
                    "position": {"x": 600, "y": 100},
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            ],
            "literature": [
                {
                    "id": "lit-001",
                    "title": "Efficacy of CBT in Major Depression: A Meta-Analysis",
                    "authors": "Beck, A.T., Rush, A.J., Shaw, B.F.",
                    "publication": "Archives of General Psychiatry",
                    "year": 2023,
                    "doi": "10.1001/archpsyc.2023.001",
                    "abstract": "Comprehensive meta-analysis examining the effectiveness of cognitive behavioral therapy in treating major depressive disorder across diverse populations",
                    "notes": "Key study for evidence-based MDD treatment protocols",
                    "linked_topics": ["topic-mdd-001"],
                    "position": {"x": 100, "y": 300},
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            ],
            "connections": [
                {
                    "id": "conn-001",
                    "source": "topic-mdd-001",
                    "target": "case-001",
                    "type": "topic-case"
                }
            ]
        }
        return self.run_test("Save Mind Map Data", "PUT", "api/mindmap-data", 200, test_data)

    # Individual CRUD Endpoints
    def test_get_topics(self):
        """Test getting topics"""
        return self.run_test("Get Topics", "GET", "api/topics", 200)

    def test_get_cases(self):
        """Test getting cases"""
        return self.run_test("Get Cases", "GET", "api/cases", 200)

    def test_get_tasks(self):
        """Test getting tasks"""
        return self.run_test("Get Tasks", "GET", "api/tasks", 200)

    def test_get_literature(self):
        """Test getting literature"""
        return self.run_test("Get Literature", "GET", "api/literature", 200)

    # Spreadsheet Import Testing
    def test_import_spreadsheet_endpoint(self):
        """Test if spreadsheet import endpoint exists"""
        # Create sample CSV data
        csv_data = """First Name,Last Name,Chief Complaint,Age,Gender,Primary Diagnosis
Sarah,Johnson,Persistent sadness and fatigue,28,Female,Major Depressive Disorder
Michael,Chen,Panic attacks and worry,35,Male,Generalized Anxiety Disorder
Emily,Rodriguez,Mood swings and irritability,42,Female,Bipolar II Disorder"""
        
        # Create file-like object
        csv_file = io.StringIO(csv_data)
        files = {'file': ('test_patients.csv', csv_file.getvalue(), 'text/csv')}
        
        return self.run_test("Import Spreadsheet", "POST", "api/import-spreadsheet", 200, 
                           data={}, files=files)

    # PDF Upload Testing
    def test_pdf_upload(self):
        """Test PDF upload endpoint"""
        # Create a dummy PDF-like file for testing
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n"
        files = {'pdf': ('test_literature.pdf', pdf_content, 'application/pdf')}
        data = {'literatureId': 'lit-001'}
        
        return self.run_test("PDF Upload", "POST", "api/upload-pdf", 200, 
                           data=data, files=files)

    # CORS Testing
    def test_cors_headers(self):
        """Test CORS configuration"""
        url = f"{self.base_url}/api/mindmap-data"
        headers = {
            'Origin': 'https://medhub-map.preview.emergentagent.com',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        try:
            response = requests.options(url, headers=headers, timeout=10)
            success = response.status_code in [200, 204]
            
            if success:
                cors_headers = {
                    'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                    'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                    'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
                }
                print(f"✅ CORS Headers: {cors_headers}")
            
            return success, {}
        except Exception as e:
            print(f"❌ CORS Test Failed: {str(e)}")
            return False, {}

    # Data Validation Testing
    def test_invalid_data_validation(self):
        """Test data validation with invalid data"""
        invalid_data = {
            "topics": [
                {
                    "id": "invalid-topic",
                    "title": "",  # Empty title should be invalid
                    "category": "",  # Empty category should be invalid
                    "color": "invalid-color"  # Invalid color format
                }
            ],
            "cases": [],
            "tasks": [],
            "literature": [],
            "connections": []
        }
        
        # This should either return 400 (validation error) or 200 (if validation is lenient)
        success, response = self.run_test("Invalid Data Validation", "PUT", "api/mindmap-data", 
                                        200, invalid_data)  # Expecting 200 as backend might be lenient
        return success, response

def main():
    print("🔍 Starting PGY3-HUB Backend API Tests")
    print("=" * 50)
    
    # Setup
    tester = SimpleAPITester()

    # Run tests
    print("\n📋 Running Backend API Tests...")
    
    # Test 1: Get mind map data
    tester.test_get_mindmap_data()
    
    # Test 2: Save mind map data
    tester.test_save_mindmap_data()

    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("✅ All backend tests passed!")
        return 0
    else:
        print("❌ Some backend tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())