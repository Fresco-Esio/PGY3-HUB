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

    def test_get_mindmap_data(self):
        """Test getting mind map data"""
        return self.run_test("Get Mind Map Data", "GET", "api/mindmap-data", 200)

    def test_save_mindmap_data(self):
        """Test saving mind map data"""
        test_data = {
            "topics": [
                {
                    "id": "test-topic-1",
                    "title": "Test Topic",
                    "description": "A test topic for API testing",
                    "category": "Test",
                    "color": "#3B82F6",
                    "position": {"x": 100, "y": 100}
                }
            ],
            "cases": [],
            "tasks": [],
            "literature": [],
            "connections": []
        }
        # Use PUT method as shown in logs
        url = f"{self.base_url}/api/mindmap-data"
        headers = {'Content-Type': 'application/json'}
        self.tests_run += 1
        print(f"\n🔍 Testing Save Mind Map Data...")
        
        try:
            response = requests.put(url, json=test_data, headers=headers, timeout=10)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
            return success, response.json() if success else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

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