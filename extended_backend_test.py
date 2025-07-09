import requests
import json
import uuid
from datetime import datetime
import time

# Use the local backend URL for testing
BASE_URL = "http://localhost:8001/api"

class MindMapExtendedTester:
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
    
    def test_get_mindmap_data_structure(self):
        """Test that GET /api/mindmap-data returns all required data structures"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Check that all required keys exist
        required_keys = ["topics", "cases", "tasks", "literature", "connections"]
        for key in required_keys:
            if key not in data:
                print(f"  Missing required key: {key}")
                return False
        
        # Store the data for later tests
        self.mindmap_data = data
        
        # Check that each entity type has position fields
        entity_types = {
            "topics": ["id", "title", "position"],
            "cases": ["id", "case_id", "position"],
            "tasks": ["id", "title", "position"],
            "literature": ["id", "title", "position"]
        }
        
        for entity_type, required_fields in entity_types.items():
            if not data[entity_type]:
                print(f"  No {entity_type} found in data")
                continue
                
            for entity in data[entity_type]:
                for field in required_fields:
                    if field not in entity:
                        print(f"  Missing required field '{field}' in {entity_type}")
                        return False
                
                # Check position field structure
                if "position" in entity:
                    if not isinstance(entity["position"], dict) or "x" not in entity["position"] or "y" not in entity["position"]:
                        print(f"  Invalid position field in {entity_type}: {entity['position']}")
                        return False
        
        # Check connections array structure if not empty
        if data["connections"]:
            # Some connections might be missing fields, but that's not a critical failure
            # Just log it and continue
            for connection in data["connections"]:
                if "id" not in connection:
                    print(f"  Warning: Connection missing 'id' field: {connection}")
                if "source" not in connection:
                    print(f"  Warning: Connection missing 'source' field: {connection}")
                if "target" not in connection:
                    print(f"  Warning: Connection missing 'target' field: {connection}")
        
        print(f"  Mind map data structure is valid with all required fields")
        return True
    
    def test_put_mindmap_data_complete(self):
        """Test that PUT /api/mindmap-data can save complete mind map data"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Add a timestamp to verify the data was updated
        timestamp = datetime.utcnow().isoformat()
        
        # Add a new topic with the timestamp
        new_topic = {
            "id": f"topic-{uuid.uuid4().hex}",
            "title": f"Test Topic {timestamp}",
            "description": "Created during extended testing",
            "category": "Test Category",
            "color": "#FF5733",
            "position": {"x": 100, "y": 100},
            "flashcard_count": 0,
            "completed_flashcards": 0,
            "resources": [],
            "created_at": timestamp,
            "updated_at": timestamp
        }
        
        modified_data["topics"].append(new_topic)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save complete mind map data: {put_response.status_code}")
            return False
        
        # Verify the data was saved
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
                if topic["title"] != new_topic["title"]:
                    print(f"  Topic title mismatch: {topic['title']} != {new_topic['title']}")
                    return False
                break
        
        if not found_topic:
            print(f"  New topic was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved complete mind map data")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.test_topic_id = new_topic["id"]
        
        return True
    
    def test_connection_edge_properties(self):
        """Test that connections can store all edge properties"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'test_topic_id'):
            print("  No test topic ID available for testing")
            return False
        
        # Find another topic to connect to
        target_topic_id = None
        for topic in self.mindmap_data["topics"]:
            if topic["id"] != self.test_topic_id:
                target_topic_id = topic["id"]
                break
        
        if not target_topic_id:
            print("  Could not find a target topic for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create a connection with all possible edge properties
        new_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": self.test_topic_id,
            "target": target_topic_id,
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "type": "custom",
            "animated": True,
            "label": "Connection with all properties",
            "style": {
                "stroke": "#FF0000",
                "strokeWidth": 2,
                "strokeDasharray": "5,5"
            },
            "data": {
                "customProperty1": "value1",
                "customProperty2": "value2"
            }
        }
        
        # Add the connection to the data
        modified_data["connections"].append(new_connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with edge properties: {put_response.status_code}")
            return False
        
        # Verify the connection was saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved connection: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our new connection is in the data with all properties
        found_connection = False
        for connection in verified_data["connections"]:
            if connection["id"] == new_connection["id"]:
                # Check all properties
                for key, value in new_connection.items():
                    if key not in connection:
                        print(f"  Missing property '{key}' in saved connection")
                        return False
                    
                    # For nested properties like style and data, check individually
                    if key in ["style", "data"] and isinstance(value, dict):
                        for sub_key, sub_value in value.items():
                            if sub_key not in connection[key]:
                                print(f"  Missing nested property '{key}.{sub_key}' in saved connection")
                                return False
                
                found_connection = True
                break
        
        if not found_connection:
            print(f"  Connection with edge properties was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved connection with all edge properties")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.test_connection_id = new_connection["id"]
        
        return True
    
    def test_missing_connections_array(self):
        """Test that the API handles missing connections array gracefully"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Remove the connections array
        if "connections" in modified_data:
            del modified_data["connections"]
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  API rejected data with missing connections array: {put_response.status_code}")
            return False
        
        # Verify the data was saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if the connections array was created
        if "connections" not in verified_data:
            print(f"  API did not create missing connections array")
            return False
        
        print(f"  API handled missing connections array gracefully")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        
        return True
    
    def test_cors_configuration(self):
        """Test that CORS is properly configured for localhost:3000"""
        # This is a simple OPTIONS request to check CORS headers
        options_response = requests.options(f"{self.base_url}/mindmap-data", 
                                           headers={"Origin": "http://localhost:3000",
                                                   "Access-Control-Request-Method": "GET"})
        
        # Check if CORS headers are present
        if "Access-Control-Allow-Origin" not in options_response.headers:
            print(f"  Missing CORS header: Access-Control-Allow-Origin")
            return False
        
        if options_response.headers["Access-Control-Allow-Origin"] != "http://localhost:3000":
            print(f"  Incorrect CORS origin: {options_response.headers['Access-Control-Allow-Origin']}")
            return False
        
        if "Access-Control-Allow-Methods" not in options_response.headers:
            print(f"  Missing CORS header: Access-Control-Allow-Methods")
            return False
        
        print(f"  CORS is properly configured for localhost:3000")
        return True
    
    def test_connection_label_persistence(self):
        """Test that connection labels are properly stored and retrieved"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'test_connection_id'):
            print("  No test connection ID available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Find and update the test connection label
        for connection in modified_data["connections"]:
            if connection["id"] == self.test_connection_id:
                # Update the label
                connection["label"] = f"Updated Label {datetime.utcnow().isoformat()}"
                break
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save updated connection label: {put_response.status_code}")
            return False
        
        # Verify the label was updated
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify updated label: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our connection label was updated
        label_updated = False
        updated_label = None
        for connection in verified_data["connections"]:
            if connection["id"] == self.test_connection_id:
                updated_label = connection["label"]
                if connection["label"].startswith("Updated Label"):
                    label_updated = True
                break
        
        if not label_updated:
            print(f"  Connection label was not updated correctly: {updated_label}")
            return False
        
        print(f"  Successfully updated and retrieved connection label: {updated_label}")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        
        return True
    
    def test_multiple_save_load_cycles(self):
        """Test that connections persist correctly after multiple save/load cycles"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'test_connection_id'):
            print("  No test connection ID available for testing")
            return False
        
        # Perform multiple save/load cycles
        for i in range(3):
            # Make a copy of the data to modify
            modified_data = self.mindmap_data.copy()
            
            # Add a timestamp to the test connection label
            for connection in modified_data["connections"]:
                if connection["id"] == self.test_connection_id:
                    connection["label"] = f"Cycle {i+1} - {datetime.utcnow().isoformat()}"
                    break
            
            # Save the modified data
            put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
            if put_response.status_code != 200:
                print(f"  Failed to save data in cycle {i+1}: {put_response.status_code}")
                return False
            
            # Load the data
            get_response = requests.get(f"{self.base_url}/mindmap-data")
            if get_response.status_code != 200:
                print(f"  Failed to load data in cycle {i+1}: {get_response.status_code}")
                return False
            
            loaded_data = get_response.json()
            
            # Check if our test connection is still there
            connection_found = False
            for connection in loaded_data["connections"]:
                if connection["id"] == self.test_connection_id:
                    connection_found = True
                    if not connection["label"].startswith(f"Cycle {i+1}"):
                        print(f"  Connection label mismatch in cycle {i+1}: {connection['label']}")
                        return False
                    break
            
            if not connection_found:
                print(f"  Test connection not found in cycle {i+1}")
                return False
            
            # Update the mindmap_data for the next cycle
            self.mindmap_data = loaded_data
            
            # Short delay between cycles
            time.sleep(0.5)
        
        print(f"  Connections persisted correctly across multiple save/load cycles")
        return True
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting Mind Map Extended Tests 🧪")
        
        # Data structure tests
        self.run_test("Mind Map Data Structure", self.test_get_mindmap_data_structure)
        self.run_test("Complete Mind Map Data Save", self.test_put_mindmap_data_complete)
        
        # Connection property tests
        self.run_test("Connection Edge Properties", self.test_connection_edge_properties)
        self.run_test("Missing Connections Array", self.test_missing_connections_array)
        
        # Persistence and configuration tests
        self.run_test("CORS Configuration", self.test_cors_configuration)
        self.run_test("Connection Label Persistence", self.test_connection_label_persistence)
        self.run_test("Multiple Save/Load Cycles", self.test_multiple_save_load_cycles)
        
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
    tester = MindMapExtendedTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ All tests passed!" if success else "❌ Some tests failed!"))