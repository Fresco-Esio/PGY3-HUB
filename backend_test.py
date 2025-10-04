#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SimpleAPITester:
    def __init__(self, base_url="https://patient-import.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

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

            return success, response.json() if success else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health check"""
        return self.run_test("Health Check", "GET", "api/health", 200)

    def test_get_mindmap_data(self):
        """Test getting mind map data"""
        return self.run_test("Get Mind Map Data", "GET", "api/mindmap", 200)

    def test_save_mindmap_data(self):
        """Test saving mind map data"""
        test_data = {
            "topics": [
                {
                    "id": "test-topic-1",
                    "label": "Test Topic",
                    "description": "A test topic for API testing",
                    "position": {"x": 100, "y": 100}
                }
            ],
            "cases": [],
            "tasks": [],
            "literature": [],
            "connections": []
        }
        return self.run_test("Save Mind Map Data", "POST", "api/mindmap", 200, test_data)

def main():
    print("🔍 Starting PGY3-HUB Backend API Tests")
    print("=" * 50)
    
    # Setup
    tester = SimpleAPITester()

    # Run tests
    print("\n📋 Running Backend API Tests...")
    
    # Test 1: Health check
    tester.test_health_check()
    
    # Test 2: Get mind map data
    tester.test_get_mindmap_data()
    
    # Test 3: Save mind map data
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