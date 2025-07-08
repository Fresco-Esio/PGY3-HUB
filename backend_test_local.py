import requests
import json
import os
import time
from datetime import datetime
import uuid
import shutil

# Use the local endpoint for testing
BASE_URL = "http://localhost:8001/api"
MINDMAP_DATA_FILE = "/app/backend/mindmap_data.json"

class LocalBackendTester:
    def __init__(self, base_url, data_file_path):
        self.base_url = base_url
        self.data_file_path = data_file_path
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
            
        self.test_results["details"].append({
            "name": name,
            "status": status
        })
        
        print(f"{status}")
        return result
    
    def backup_data_file(self):
        """Create a backup of the data file if it exists"""
        if os.path.exists(self.data_file_path):
            backup_path = f"{self.data_file_path}.bak"
            shutil.copy2(self.data_file_path, backup_path)
            return backup_path
        return None
    
    def restore_data_file(self, backup_path):
        """Restore the data file from backup"""
        if backup_path and os.path.exists(backup_path):
            shutil.copy2(backup_path, self.data_file_path)
            os.remove(backup_path)
    
    def test_api_root(self):
        """Test the API root endpoint"""
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data or "PGY-3 HQ API is running" not in data["message"]:
            print(f"  Expected message about API running, got {data}")
            return False
            
        return True
    
    def test_get_mindmap_data(self):
        """Test getting mindmap data from JSON file"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        # Check that the response has the expected structure
        if not all(key in data for key in ["topics", "cases", "tasks", "literature", "connections"]):
            print(f"  Missing expected keys in response: {data.keys()}")
            return False
        
        # Store some data for later tests
        if data["topics"]:
            self.topic_id = data["topics"][0]["id"]
            print(f"  Sample topic: {data['topics'][0]['title']}")
        
        if data["cases"]:
            self.case_id = data["cases"][0]["id"]
            print(f"  Sample case: {data['cases'][0]['case_id']}")
        
        if data["tasks"]:
            self.task_id = data["tasks"][0]["id"]
            print(f"  Sample task: {data['tasks'][0]['title']}")
        
        if data["literature"]:
            self.literature_id = data["literature"][0]["id"]
            print(f"  Sample literature: {data['literature'][0]['title']}")
            
        return True
    
    def test_put_mindmap_data(self):
        """Test saving mindmap data to JSON file"""
        # First, get the current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Make a modification to the data
        test_id = str(uuid.uuid4())
        if current_data["topics"]:
            current_data["topics"][0]["description"] = f"Modified by test {test_id}"
        
        # Add a new connection
        if current_data["topics"] and current_data["cases"]:
            new_connection = {
                "id": f"e-{test_id}",
                "source": current_data["topics"][0]["id"],
                "target": current_data["cases"][0]["id"],
                "sourceHandle": "right",
                "targetHandle": "left",
                "type": "default"
            }
            current_data["connections"].append(new_connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=current_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data: {put_response.status_code}")
            return False
        
        # Verify the data was saved by getting it again
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check that our modifications were saved
        if current_data["topics"] and verified_data["topics"]:
            if verified_data["topics"][0]["description"] != f"Modified by test {test_id}":
                print(f"  Topic description was not saved correctly")
                return False
        
        # Check that our new connection was saved
        connection_found = False
        for conn in verified_data["connections"]:
            if conn.get("id") == f"e-{test_id}":
                connection_found = True
                # Verify all connection properties were saved
                if conn.get("source") != current_data["topics"][0]["id"] or \
                   conn.get("target") != current_data["cases"][0]["id"] or \
                   conn.get("sourceHandle") != "right" or \
                   conn.get("targetHandle") != "left":
                    print(f"  Connection properties were not saved correctly: {conn}")
                    return False
                break
        
        if not connection_found and current_data["topics"] and current_data["cases"]:
            print(f"  New connection was not saved")
            return False
            
        print(f"  Data modifications were saved successfully")
        return True
    
    def test_json_file_creation(self):
        """Test that the JSON file is created with initial data"""
        # Rename the existing file if it exists
        backup_path = None
        if os.path.exists(self.data_file_path):
            backup_path = f"{self.data_file_path}.test_bak"
            os.rename(self.data_file_path, backup_path)
        
        try:
            # Get the data, which should create a new file with initial data
            response = requests.get(f"{self.base_url}/mindmap-data")
            if response.status_code != 200:
                print(f"  Failed to get data: {response.status_code}")
                return False
            
            # Check that the file was created
            if not os.path.exists(self.data_file_path):
                print(f"  JSON file was not created at {self.data_file_path}")
                return False
            
            # Check the file content
            with open(self.data_file_path, 'r') as f:
                file_data = json.load(f)
            
            # Verify the file contains the expected structure
            if not all(key in file_data for key in ["topics", "cases", "tasks", "literature", "connections"]):
                print(f"  JSON file missing expected keys: {file_data.keys()}")
                return False
            
            # Verify the file contains initial dummy data
            if len(file_data["topics"]) < 1 or len(file_data["cases"]) < 1 or len(file_data["tasks"]) < 1 or len(file_data["literature"]) < 1:
                print(f"  JSON file does not contain expected initial data")
                return False
            
            print(f"  JSON file was created with initial data successfully")
            return True
        finally:
            # Restore the original file
            if backup_path:
                if os.path.exists(self.data_file_path):
                    os.remove(self.data_file_path)
                os.rename(backup_path, self.data_file_path)
    
    def test_data_persistence(self):
        """Test that data persists between requests"""
        # Create a unique marker
        test_marker = f"persistence-test-{uuid.uuid4()}"
        
        # Get current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Add a new topic with our marker
        new_topic = {
            "id": str(uuid.uuid4()),
            "title": test_marker,
            "description": "Testing data persistence",
            "category": "Test Category",
            "color": "#FF5733",
            "position": {"x": 100, "y": 100},
            "flashcard_count": 0,
            "completed_flashcards": 0,
            "resources": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        current_data["topics"].append(new_topic)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=current_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data: {put_response.status_code}")
            return False
        
        # Get the data again from a new request
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check that our new topic exists
        topic_found = False
        for topic in verified_data["topics"]:
            if topic.get("title") == test_marker:
                topic_found = True
                break
        
        if not topic_found:
            print(f"  New topic was not persisted between requests")
            return False
        
        # Clean up by removing our test topic
        verified_data["topics"] = [t for t in verified_data["topics"] if t.get("title") != test_marker]
        cleanup_response = requests.put(f"{self.base_url}/mindmap-data", json=verified_data)
        if cleanup_response.status_code != 200:
            print(f"  Warning: Failed to clean up test data: {cleanup_response.status_code}")
        
        print(f"  Data persistence verified successfully")
        return True
    
    def test_datetime_serialization(self):
        """Test that datetime fields are properly serialized and deserialized"""
        # Get current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Create a new task with specific datetime fields
        now = datetime.now()
        new_task = {
            "id": str(uuid.uuid4()),
            "title": f"Datetime Test Task {uuid.uuid4().hex[:6]}",
            "description": "Testing datetime serialization",
            "status": "pending",
            "priority": "high",
            "due_date": now.isoformat(),
            "position": {"x": 200, "y": 200},
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        current_data["tasks"].append(new_task)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=current_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data: {put_response.status_code}")
            return False
        
        # Get the data again
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Find our test task
        task_found = False
        for task in verified_data["tasks"]:
            if task.get("id") == new_task["id"]:
                task_found = True
                
                # Check that datetime fields were properly handled
                if "due_date" not in task or not task["due_date"]:
                    print(f"  Due date field was lost during serialization")
                    return False
                
                if "created_at" not in task or not task["created_at"]:
                    print(f"  Created_at field was lost during serialization")
                    return False
                
                if "updated_at" not in task or not task["updated_at"]:
                    print(f"  Updated_at field was lost during serialization")
                    return False
                
                # Try to parse the datetime strings
                try:
                    datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
                    datetime.fromisoformat(task["created_at"].replace('Z', '+00:00'))
                    datetime.fromisoformat(task["updated_at"].replace('Z', '+00:00'))
                except Exception as e:
                    print(f"  Failed to parse datetime fields: {e}")
                    return False
                
                break
        
        if not task_found:
            print(f"  Test task was not found after saving")
            return False
        
        # Clean up by removing our test task
        verified_data["tasks"] = [t for t in verified_data["tasks"] if t.get("id") != new_task["id"]]
        cleanup_response = requests.put(f"{self.base_url}/mindmap-data", json=verified_data)
        if cleanup_response.status_code != 200:
            print(f"  Warning: Failed to clean up test data: {cleanup_response.status_code}")
        
        print(f"  Datetime serialization verified successfully")
        return True
    
    def test_data_structure_validation(self):
        """Test that all data structures are properly handled"""
        # Get current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        data = get_response.json()
        
        # Check topics structure
        for topic in data["topics"]:
            if not all(key in topic for key in ["id", "title", "category", "position"]):
                print(f"  Topic missing required fields: {topic}")
                return False
            
            if not isinstance(topic["position"], dict) or not all(key in topic["position"] for key in ["x", "y"]):
                print(f"  Topic position field invalid: {topic['position']}")
                return False
        
        # Check cases structure
        for case in data["cases"]:
            if not all(key in case for key in ["id", "case_id", "primary_diagnosis", "chief_complaint", "position"]):
                print(f"  Case missing required fields: {case}")
                return False
            
            if not isinstance(case["position"], dict) or not all(key in case["position"] for key in ["x", "y"]):
                print(f"  Case position field invalid: {case['position']}")
                return False
        
        # Check tasks structure
        for task in data["tasks"]:
            if not all(key in task for key in ["id", "title", "status", "priority", "position"]):
                print(f"  Task missing required fields: {task}")
                return False
            
            if not isinstance(task["position"], dict) or not all(key in task["position"] for key in ["x", "y"]):
                print(f"  Task position field invalid: {task['position']}")
                return False
        
        # Check literature structure
        for lit in data["literature"]:
            if not all(key in lit for key in ["id", "title", "position"]):
                print(f"  Literature missing required fields: {lit}")
                return False
            
            if not isinstance(lit["position"], dict) or not all(key in lit["position"] for key in ["x", "y"]):
                print(f"  Literature position field invalid: {lit['position']}")
                return False
        
        # Check connections structure
        for conn in data["connections"]:
            if not all(key in conn for key in ["id", "source", "target"]):
                print(f"  Connection missing required fields: {conn}")
                return False
            
            # Check for sourceHandle and targetHandle
            if "sourceHandle" not in conn or "targetHandle" not in conn:
                print(f"  Connection missing handle fields: {conn}")
                return False
        
        print(f"  Data structure validation passed")
        return True
    
    def test_cors_functionality(self):
        """Test CORS functionality for localhost:3000"""
        # Make a preflight OPTIONS request
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type"
        }
        
        response = requests.options(f"{self.base_url}/mindmap-data", headers=headers)
        
        # Check for CORS headers
        if "Access-Control-Allow-Origin" not in response.headers:
            print(f"  Missing Access-Control-Allow-Origin header")
            return False
        
        if response.headers["Access-Control-Allow-Origin"] != "http://localhost:3000":
            print(f"  Incorrect Access-Control-Allow-Origin: {response.headers['Access-Control-Allow-Origin']}")
            return False
        
        if "Access-Control-Allow-Methods" not in response.headers:
            print(f"  Missing Access-Control-Allow-Methods header")
            return False
        
        print(f"  CORS headers verified successfully")
        return True
    
    def test_invalid_json_handling(self):
        """Test handling of invalid JSON data"""
        # Try to send invalid JSON data
        invalid_data = {
            "topics": "not_a_list",  # Should be a list
            "cases": [],
            "tasks": [],
            "literature": [],
            "connections": []
        }
        
        response = requests.put(f"{self.base_url}/mindmap-data", json=invalid_data)
        
        # Should return an error status code
        if response.status_code < 400:
            print(f"  Expected error status code, got {response.status_code}")
            return False
        
        print(f"  Invalid JSON handling verified successfully")
        return True
    
    def test_file_permissions(self):
        """Test file permissions and access"""
        # Check if we can read the file
        if not os.path.exists(self.data_file_path):
            print(f"  Data file does not exist: {self.data_file_path}")
            return False
        
        try:
            with open(self.data_file_path, 'r') as f:
                json.load(f)
        except PermissionError:
            print(f"  Permission denied when reading file")
            return False
        except json.JSONDecodeError:
            print(f"  File contains invalid JSON")
            return False
        
        # Check if we can write to the file
        try:
            # Read current content
            with open(self.data_file_path, 'r') as f:
                current_content = f.read()
            
            # Write the same content back
            with open(self.data_file_path, 'w') as f:
                f.write(current_content)
        except PermissionError:
            print(f"  Permission denied when writing to file")
            return False
        
        print(f"  File permissions verified successfully")
        return True
    
    def test_integration_create_update_delete(self):
        """Test creating, updating, and deleting nodes via bulk mindmap-data endpoint"""
        # Get current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Create a unique ID for our test entities
        test_id = str(uuid.uuid4())
        
        # Add a new topic
        new_topic = {
            "id": f"topic-{test_id}",
            "title": f"Integration Test Topic {test_id[:6]}",
            "description": "Testing integration",
            "category": "Test Category",
            "color": "#FF5733",
            "position": {"x": 100, "y": 100},
            "flashcard_count": 0,
            "completed_flashcards": 0,
            "resources": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add a new case
        new_case = {
            "id": f"case-{test_id}",
            "case_id": f"INT-{test_id[:6]}",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Test Diagnosis",
            "secondary_diagnoses": [],
            "chief_complaint": "Test complaint",
            "position": {"x": 300, "y": 100},
            "linked_topics": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add a new connection
        new_connection = {
            "id": f"conn-{test_id}",
            "source": f"topic-{test_id}",
            "target": f"case-{test_id}",
            "sourceHandle": "right",
            "targetHandle": "left",
            "type": "default"
        }
        
        # Add our test entities
        current_data["topics"].append(new_topic)
        current_data["cases"].append(new_case)
        current_data["connections"].append(new_connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=current_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data: {put_response.status_code}")
            return False
        
        # Get the data again to verify creation
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check that our entities were created
        topic_found = any(t.get("id") == f"topic-{test_id}" for t in verified_data["topics"])
        case_found = any(c.get("id") == f"case-{test_id}" for c in verified_data["cases"])
        conn_found = any(c.get("id") == f"conn-{test_id}" for c in verified_data["connections"])
        
        if not (topic_found and case_found and conn_found):
            print(f"  Not all entities were created successfully")
            return False
        
        # Update our entities
        for topic in verified_data["topics"]:
            if topic.get("id") == f"topic-{test_id}":
                topic["description"] = "Updated description"
        
        # Save the updated data
        update_response = requests.put(f"{self.base_url}/mindmap-data", json=verified_data)
        if update_response.status_code != 200:
            print(f"  Failed to update data: {update_response.status_code}")
            return False
        
        # Get the data again to verify update
        verify_update_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_update_response.status_code != 200:
            print(f"  Failed to verify updated data: {verify_update_response.status_code}")
            return False
        
        updated_data = verify_update_response.json()
        
        # Check that our update was applied
        update_verified = False
        for topic in updated_data["topics"]:
            if topic.get("id") == f"topic-{test_id}" and topic.get("description") == "Updated description":
                update_verified = True
                break
        
        if not update_verified:
            print(f"  Update was not applied successfully")
            return False
        
        # Delete our entities
        updated_data["topics"] = [t for t in updated_data["topics"] if t.get("id") != f"topic-{test_id}"]
        updated_data["cases"] = [c for c in updated_data["cases"] if c.get("id") != f"case-{test_id}"]
        updated_data["connections"] = [c for c in updated_data["connections"] if c.get("id") != f"conn-{test_id}"]
        
        # Save the data with deletions
        delete_response = requests.put(f"{self.base_url}/mindmap-data", json=updated_data)
        if delete_response.status_code != 200:
            print(f"  Failed to delete data: {delete_response.status_code}")
            return False
        
        # Get the data again to verify deletion
        verify_delete_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_delete_response.status_code != 200:
            print(f"  Failed to verify deleted data: {verify_delete_response.status_code}")
            return False
        
        deleted_data = verify_delete_response.json()
        
        # Check that our entities were deleted
        topic_still_exists = any(t.get("id") == f"topic-{test_id}" for t in deleted_data["topics"])
        case_still_exists = any(c.get("id") == f"case-{test_id}" for c in deleted_data["cases"])
        conn_still_exists = any(c.get("id") == f"conn-{test_id}" for c in deleted_data["connections"])
        
        if topic_still_exists or case_still_exists or conn_still_exists:
            print(f"  Not all entities were deleted successfully")
            return False
        
        print(f"  Integration test for create, update, delete successful")
        return True
    
    def test_connection_persistence(self):
        """Test saving connections and verifying they persist"""
        # Get current data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to get current data: {get_response.status_code}")
            return False
        
        current_data = get_response.json()
        
        # Create test entities
        test_id = str(uuid.uuid4())
        
        # Add two new topics
        topic1 = {
            "id": f"topic1-{test_id}",
            "title": f"Connection Test Topic 1 {test_id[:6]}",
            "description": "Testing connections",
            "category": "Test Category",
            "color": "#FF5733",
            "position": {"x": 100, "y": 100},
            "flashcard_count": 0,
            "completed_flashcards": 0,
            "resources": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        topic2 = {
            "id": f"topic2-{test_id}",
            "title": f"Connection Test Topic 2 {test_id[:6]}",
            "description": "Testing connections",
            "category": "Test Category",
            "color": "#33FF57",
            "position": {"x": 300, "y": 100},
            "flashcard_count": 0,
            "completed_flashcards": 0,
            "resources": [],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add a connection between them with sourceHandle and targetHandle
        connection = {
            "id": f"conn-{test_id}",
            "source": f"topic1-{test_id}",
            "target": f"topic2-{test_id}",
            "sourceHandle": "right",
            "targetHandle": "left",
            "type": "default"
        }
        
        # Add our test entities
        current_data["topics"].append(topic1)
        current_data["topics"].append(topic2)
        current_data["connections"].append(connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=current_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data: {put_response.status_code}")
            return False
        
        # Get the data again to verify
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check that our connection was saved with all properties
        conn_found = False
        for conn in verified_data["connections"]:
            if conn.get("id") == f"conn-{test_id}":
                conn_found = True
                
                # Check all connection properties
                if conn.get("source") != f"topic1-{test_id}":
                    print(f"  Connection source not saved correctly: {conn.get('source')}")
                    return False
                
                if conn.get("target") != f"topic2-{test_id}":
                    print(f"  Connection target not saved correctly: {conn.get('target')}")
                    return False
                
                if conn.get("sourceHandle") != "right":
                    print(f"  Connection sourceHandle not saved correctly: {conn.get('sourceHandle')}")
                    return False
                
                if conn.get("targetHandle") != "left":
                    print(f"  Connection targetHandle not saved correctly: {conn.get('targetHandle')}")
                    return False
                
                break
        
        if not conn_found:
            print(f"  Connection was not saved")
            return False
        
        # Clean up
        verified_data["topics"] = [t for t in verified_data["topics"] if t.get("id") not in [f"topic1-{test_id}", f"topic2-{test_id}"]]
        verified_data["connections"] = [c for c in verified_data["connections"] if c.get("id") != f"conn-{test_id}"]
        
        cleanup_response = requests.put(f"{self.base_url}/mindmap-data", json=verified_data)
        if cleanup_response.status_code != 200:
            print(f"  Warning: Failed to clean up test data: {cleanup_response.status_code}")
        
        print(f"  Connection persistence verified successfully")
        return True
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting Local JSON-based Backend Tests 🧪")
        
        # Create a backup of the data file
        backup_path = self.backup_data_file()
        
        try:
            # Basic API tests
            self.run_test("API Root Endpoint", self.test_api_root)
            self.run_test("Get Mind Map Data", self.test_get_mindmap_data)
            self.run_test("Put Mind Map Data", self.test_put_mindmap_data)
            
            # JSON file tests
            self.run_test("JSON File Creation", self.test_json_file_creation)
            self.run_test("Data Persistence", self.test_data_persistence)
            self.run_test("Datetime Serialization", self.test_datetime_serialization)
            
            # Data structure tests
            self.run_test("Data Structure Validation", self.test_data_structure_validation)
            
            # Error handling tests
            self.run_test("CORS Functionality", self.test_cors_functionality)
            self.run_test("Invalid JSON Handling", self.test_invalid_json_handling)
            self.run_test("File Permissions", self.test_file_permissions)
            
            # Integration tests
            self.run_test("Integration: Create, Update, Delete", self.test_integration_create_update_delete)
            self.run_test("Connection Persistence", self.test_connection_persistence)
        finally:
            # Restore the data file from backup
            if backup_path:
                self.restore_data_file(backup_path)
        
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
    tester = LocalBackendTester(BASE_URL, MINDMAP_DATA_FILE)
    success = tester.run_all_tests()
    print("\n" + ("✅ All tests passed!" if success else "❌ Some tests failed!"))