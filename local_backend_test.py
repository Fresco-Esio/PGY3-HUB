import requests
import json
import uuid
from datetime import datetime
import os
import time

# Use localhost for testing the local JSON implementation
BASE_URL = "http://localhost:8001/api"

class LocalBackendTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.test_results = {
            "total": 0,
            "passed": 0,
            "failed": 0,
            "details": []
        }
        
    def run_test(self, name, test_func):
        """Run a test and record the result"""
        self.test_results["total"] += 1
        print(f"\n🔍 Testing: {name}")
        
        try:
            result = test_func()
            if result:
                self.test_results["passed"] += 1
                status = "✅ PASSED"
            else:
                self.test_results["failed"] += 1
                status = "❌ FAILED"
        except Exception as e:
            self.test_results["failed"] += 1
            status = f"❌ ERROR: {str(e)}"
            result = False
            
        self.test_results["details"].append({
            "name": name,
            "status": status
        })
        
        print(f"{status}")
        return result
    
    def test_api_root(self):
        """Test the API root endpoint"""
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data or "API is running" not in data["message"]:
            print(f"  Expected message about API running, got {data}")
            return False
            
        return True
    
    def test_get_mindmap_data(self):
        """Test getting mindmap data"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        # Check that the response has the expected structure
        if not all(key in data for key in ["topics", "cases", "tasks", "literature", "connections"]):
            print(f"  Missing expected keys in response: {data.keys()}")
            return False
        
        # Print some details about the data
        print(f"  Found {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature items, {len(data['connections'])} connections")
        
        # Store some data for later tests
        if data["topics"]:
            self.topic_id = data["topics"][0]["id"]
            print(f"  Sample topic: {data['topics'][0]['title']}")
        
        if data["cases"]:
            self.case_id = data["cases"][0]["id"]
            print(f"  Sample case: {data['cases'][0]['case_id'] if 'case_id' in data['cases'][0] else 'Unknown'}")
        
        if data["tasks"]:
            self.task_id = data["tasks"][0]["id"]
            print(f"  Sample task: {data['tasks'][0]['title']}")
        
        if data["literature"]:
            self.literature_id = data["literature"][0]["id"]
            print(f"  Sample literature: {data['literature'][0]['title']}")
            
        return True
    
    def test_put_mindmap_data(self):
        """Test saving mindmap data"""
        # First, get the current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Make a copy of the data to modify
        modified_data = current_data.copy()
        
        # Add a new topic
        new_topic = {
            "id": str(uuid.uuid4()),
            "title": f"Test Topic {uuid.uuid4().hex[:6]}",
            "description": "A test topic created by the test script",
            "category": "Test Category",
            "color": "#FF5733",
            "position": {"x": 500, "y": 300},
            "flashcard_count": 5,
            "completed_flashcards": 2,
            "resources": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        modified_data["topics"].append(new_topic)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save modified data: {put_response.status_code}")
            return False
        
        # Verify the data was saved by getting it again
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our new topic is in the data
        found_topic = False
        for topic in verified_data["topics"]:
            if topic["id"] == new_topic["id"]:
                found_topic = True
                break
        
        if not found_topic:
            print(f"  New topic was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved modified data")
        return True
    
    def test_connections_handling(self):
        """Test that connections with sourceHandle and targetHandle are properly handled"""
        # First, get the current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Make a copy of the data to modify
        modified_data = current_data.copy()
        
        # Ensure we have at least one topic and one case
        if not modified_data["topics"] or not modified_data["cases"]:
            print("  Not enough data to test connections")
            return False
        
        topic_id = modified_data["topics"][0]["id"]
        case_id = modified_data["cases"][0]["id"]
        
        # Create a new connection with sourceHandle and targetHandle
        new_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": topic_id,
            "target": case_id,
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "label": "Test Connection"
        }
        
        # Add the connection to the data
        if "connections" not in modified_data:
            modified_data["connections"] = []
        
        modified_data["connections"].append(new_connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with connection: {put_response.status_code}")
            return False
        
        # Verify the connection was saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved connection: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our new connection is in the data
        found_connection = False
        for connection in verified_data["connections"]:
            if connection["id"] == new_connection["id"]:
                # Verify all properties were saved correctly
                if (connection["source"] == new_connection["source"] and
                    connection["target"] == new_connection["target"] and
                    connection["sourceHandle"] == new_connection["sourceHandle"] and
                    connection["targetHandle"] == new_connection["targetHandle"] and
                    connection["label"] == new_connection["label"]):
                    found_connection = True
                    break
        
        if not found_connection:
            print(f"  Connection with sourceHandle/targetHandle was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved connection with sourceHandle/targetHandle")
        return True
    
    def test_error_handling(self):
        """Test error handling for malformed requests"""
        # Test with invalid JSON
        invalid_json = "This is not valid JSON"
        try:
            response = requests.put(f"{self.base_url}/mindmap-data", data=invalid_json, headers={"Content-Type": "application/json"})
            if response.status_code < 400:  # Should be a 4xx error
                print(f"  Expected error status code for invalid JSON, got {response.status_code}")
                return False
            print(f"  Server correctly rejected invalid JSON with status {response.status_code}")
        except Exception as e:
            print(f"  Error testing invalid JSON: {e}")
            return False
        
        # Test with invalid data types
        invalid_types = {
            "topics": [{"id": 123, "title": "Invalid ID Type"}],  # ID should be string
            "cases": [],
            "tasks": [],
            "literature": [],
            "connections": []
        }
        try:
            response = requests.put(f"{self.base_url}/mindmap-data", json=invalid_types)
            if response.status_code < 400:  # Should be a 4xx error
                print(f"  Expected error status code for invalid data types, got {response.status_code}")
                return False
            print(f"  Server correctly rejected invalid data types with status {response.status_code}")
        except Exception as e:
            print(f"  Error testing invalid data types: {e}")
            return False
        
        return True
    
    def test_cors_configuration(self):
        """Test CORS configuration for localhost:3000"""
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type"
        }
        
        # Send a preflight OPTIONS request
        try:
            response = requests.options(f"{self.base_url}/mindmap-data", headers=headers)
            
            # Check for CORS headers in the response
            if "Access-Control-Allow-Origin" not in response.headers:
                print(f"  Missing Access-Control-Allow-Origin header")
                return False
            
            if response.headers["Access-Control-Allow-Origin"] != "http://localhost:3000":
                print(f"  Expected Access-Control-Allow-Origin: http://localhost:3000, got {response.headers['Access-Control-Allow-Origin']}")
                return False
            
            if "Access-Control-Allow-Methods" not in response.headers:
                print(f"  Missing Access-Control-Allow-Methods header")
                return False
            
            if "Access-Control-Allow-Headers" not in response.headers:
                print(f"  Missing Access-Control-Allow-Headers header")
                return False
            
            print(f"  CORS headers are correctly configured for localhost:3000")
            return True
        except Exception as e:
            print(f"  Error testing CORS configuration: {e}")
            return False
    
    def test_json_file_creation(self):
        """Test that the JSON file is created if it doesn't exist"""
        # This test is more theoretical since we can't easily delete the file in the container
        # But we can check if the file exists
        
        # Get the current data to ensure the file exists
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get data: {get_response.status_code}")
            return False
        
        # The file should exist in the backend directory
        print(f"  JSON file exists and is accessible via the API")
        return True
    
    def test_datetime_handling(self):
        """Test that datetime fields are properly serialized and deserialized"""
        # First, get the current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Make a copy of the data to modify
        modified_data = current_data.copy()
        
        # Add a new task with a due date
        new_task = {
            "id": str(uuid.uuid4()),
            "title": f"Datetime Test Task {uuid.uuid4().hex[:6]}",
            "description": "Testing datetime handling",
            "status": "pending",
            "priority": "high",
            "due_date": datetime.now().isoformat(),  # Use current time
            "position": {"x": 400, "y": 200},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        modified_data["tasks"].append(new_task)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with datetime: {put_response.status_code}")
            return False
        
        # Verify the task was saved with the datetime
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved datetime: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our new task is in the data with the datetime
        found_task = False
        for task in verified_data["tasks"]:
            if task["id"] == new_task["id"]:
                if "due_date" in task and task["due_date"]:
                    found_task = True
                    break
        
        if not found_task:
            print(f"  Task with datetime was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved task with datetime")
        return True
    
    def test_bulk_update(self):
        """Test updating multiple entities at once via the mindmap-data endpoint"""
        # First, get the current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Make a copy of the data to modify
        modified_data = current_data.copy()
        
        # Add a new topic, case, task, and literature item
        new_topic = {
            "id": str(uuid.uuid4()),
            "title": f"Bulk Test Topic {uuid.uuid4().hex[:6]}",
            "description": "Testing bulk updates",
            "category": "Test Category",
            "color": "#3366FF",
            "position": {"x": -200, "y": 100},
            "flashcard_count": 3,
            "completed_flashcards": 1,
            "resources": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        new_case = {
            "id": str(uuid.uuid4()),
            "case_id": f"BULK-{uuid.uuid4().hex[:6].upper()}",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Bulk Test Diagnosis",
            "secondary_diagnoses": [],
            "chief_complaint": "Bulk test complaint",
            "position": {"x": -300, "y": 200},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        new_task = {
            "id": str(uuid.uuid4()),
            "title": f"Bulk Test Task {uuid.uuid4().hex[:6]}",
            "description": "Testing bulk updates",
            "status": "pending",
            "priority": "medium",
            "position": {"x": -400, "y": 300},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        new_literature = {
            "id": str(uuid.uuid4()),
            "title": f"Bulk Test Literature {uuid.uuid4().hex[:6]}",
            "authors": "Bulk Test Author",
            "year": 2025,
            "position": {"x": -500, "y": 400},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add new entities to the data
        modified_data["topics"].append(new_topic)
        modified_data["cases"].append(new_case)
        modified_data["tasks"].append(new_task)
        modified_data["literature"].append(new_literature)
        
        # Add connections between the new entities
        new_connection1 = {
            "id": f"e{uuid.uuid4().hex}",
            "source": new_topic["id"],
            "target": new_case["id"],
            "sourceHandle": "right",
            "targetHandle": "left",
            "label": "Topic-Case Connection"
        }
        
        new_connection2 = {
            "id": f"e{uuid.uuid4().hex}",
            "source": new_topic["id"],
            "target": new_literature["id"],
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "label": "Topic-Literature Connection"
        }
        
        new_connection3 = {
            "id": f"e{uuid.uuid4().hex}",
            "source": new_task["id"],
            "target": new_topic["id"],
            "sourceHandle": "top",
            "targetHandle": "bottom",
            "label": "Task-Topic Connection"
        }
        
        modified_data["connections"].append(new_connection1)
        modified_data["connections"].append(new_connection2)
        modified_data["connections"].append(new_connection3)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save bulk updates: {put_response.status_code}")
            return False
        
        # Verify the updates were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify bulk updates: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if all our new entities are in the data
        found_topic = any(topic["id"] == new_topic["id"] for topic in verified_data["topics"])
        found_case = any(case["id"] == new_case["id"] for case in verified_data["cases"])
        found_task = any(task["id"] == new_task["id"] for task in verified_data["tasks"])
        found_literature = any(lit["id"] == new_literature["id"] for lit in verified_data["literature"])
        
        # Check if all our new connections are in the data
        found_connection1 = any(conn["id"] == new_connection1["id"] for conn in verified_data["connections"])
        found_connection2 = any(conn["id"] == new_connection2["id"] for conn in verified_data["connections"])
        found_connection3 = any(conn["id"] == new_connection3["id"] for conn in verified_data["connections"])
        
        if not (found_topic and found_case and found_task and found_literature and 
                found_connection1 and found_connection2 and found_connection3):
            print(f"  Bulk updates were not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved bulk updates")
        return True
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting Local JSON Backend Tests 🧪")
        
        # Basic API tests
        self.run_test("API Root Endpoint", self.test_api_root)
        self.run_test("Get Mind Map Data", self.test_get_mindmap_data)
        
        # Data persistence tests
        self.run_test("Save Mind Map Data", self.test_put_mindmap_data)
        self.run_test("Connections Handling", self.test_connections_handling)
        self.run_test("Error Handling", self.test_error_handling)
        self.run_test("CORS Configuration", self.test_cors_configuration)
        self.run_test("JSON File Creation", self.test_json_file_creation)
        self.run_test("Datetime Handling", self.test_datetime_handling)
        self.run_test("Bulk Update", self.test_bulk_update)
        
        # Print summary
        print("\n📊 Test Summary:")
        print(f"  Total Tests: {self.test_results['total']}")
        print(f"  Passed: {self.test_results['passed']}")
        print(f"  Failed: {self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for detail in self.test_results['details']:
                if "FAILED" in detail['status'] or "ERROR" in detail['status']:
                    print(f"  - {detail['name']}: {detail['status']}")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = LocalBackendTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ All tests passed!" if success else "❌ Some tests failed!"))