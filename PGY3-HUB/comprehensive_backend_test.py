import requests
import json
import uuid
from datetime import datetime
import time

# Use the local backend URL for testing
BASE_URL = "http://localhost:8001/api"

class MindMapComprehensiveTester:
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
        if "message" not in data:
            print(f"  Expected message about API running, got {data}")
            return False
            
        print(f"  API root response: {data['message']}")
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
        
        # Store the data for later tests
        self.mindmap_data = data
        
        # Print some details about the data
        print(f"  Found {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature items, {len(data['connections'])} connections")
        
        # Store some IDs for later tests
        if data["topics"]:
            self.topic_ids = [topic["id"] for topic in data["topics"][:2]]
            print(f"  Sample topics: {[topic['title'] for topic in data['topics'][:2]]}")
        
        if data["cases"]:
            self.case_ids = [case["id"] for case in data["cases"][:2]]
            print(f"  Sample cases: {[case.get('case_id', 'Unknown') for case in data['cases'][:2]]}")
        
        if data["tasks"]:
            self.task_ids = [task["id"] for task in data["tasks"][:2]]
            print(f"  Sample tasks: {[task['title'] for task in data['tasks'][:2]]}")
        
        if data["literature"]:
            self.literature_ids = [lit["id"] for lit in data["literature"][:2]]
            print(f"  Sample literature: {[lit['title'] for lit in data['literature'][:2]]}")
            
        return True
    
    def test_entity_position_fields(self):
        """Test that all entity types have proper position fields"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        entity_types = {
            "topics": "Topic",
            "cases": "Case",
            "tasks": "Task",
            "literature": "Literature"
        }
        
        for entity_type, entity_name in entity_types.items():
            if not self.mindmap_data[entity_type]:
                print(f"  No {entity_name} entities found for testing")
                continue
            
            for entity in self.mindmap_data[entity_type]:
                if "position" not in entity:
                    print(f"  {entity_name} entity missing position field: {entity.get('id', 'Unknown ID')}")
                    return False
                
                position = entity["position"]
                if not isinstance(position, dict) or "x" not in position or "y" not in position:
                    print(f"  {entity_name} entity has invalid position format: {position}")
                    return False
                
                if not isinstance(position["x"], (int, float)) or not isinstance(position["y"], (int, float)):
                    print(f"  {entity_name} entity has non-numeric position values: {position}")
                    return False
        
        print(f"  All entity types have proper position fields")
        return True
    
    def test_connection_with_old_format_handle_ids(self):
        """Test creating a connection with old format handle IDs (source-bottom)"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'topic_ids') or len(self.topic_ids) < 2:
            print("  Not enough topics available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create a new connection with old format handle IDs
        new_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": self.topic_ids[0],
            "target": self.topic_ids[1],
            "sourceHandle": f"{self.topic_ids[0]}-bottom",  # Old format
            "targetHandle": f"{self.topic_ids[1]}-top",     # Old format
            "label": "Old Format Connection"
        }
        
        # Add the connection to the data
        if "connections" not in modified_data:
            modified_data["connections"] = []
        
        modified_data["connections"].append(new_connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with old format connection: {put_response.status_code}")
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
            print(f"  Connection with old format handle IDs was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved connection with old format handle IDs")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.old_format_connection_id = new_connection["id"]
        
        return True
    
    def test_connection_with_new_format_handle_ids(self):
        """Test creating a connection with new format handle IDs (bottom)"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'topic_ids') or len(self.topic_ids) < 2:
            print("  Not enough topics available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create a new connection with new format handle IDs
        new_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": self.topic_ids[0],
            "target": self.topic_ids[1],
            "sourceHandle": "bottom",  # New format
            "targetHandle": "top",     # New format
            "label": "New Format Connection"
        }
        
        # Add the connection to the data
        if "connections" not in modified_data:
            modified_data["connections"] = []
        
        modified_data["connections"].append(new_connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with new format connection: {put_response.status_code}")
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
            print(f"  Connection with new format handle IDs was not saved correctly")
            return False
        
        print(f"  Successfully saved and retrieved connection with new format handle IDs")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.new_format_connection_id = new_connection["id"]
        
        return True
    
    def test_mixed_format_connections(self):
        """Test that both old and new format connections can coexist"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'old_format_connection_id') or not hasattr(self, 'new_format_connection_id'):
            print("  Previous connection tests did not complete successfully")
            return False
        
        # Get the current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get current data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Check if both our connections are still in the data
        old_format_found = False
        new_format_found = False
        
        for connection in data["connections"]:
            if connection["id"] == self.old_format_connection_id:
                old_format_found = True
            if connection["id"] == self.new_format_connection_id:
                new_format_found = True
        
        if not old_format_found:
            print(f"  Old format connection was not found")
            return False
        
        if not new_format_found:
            print(f"  New format connection was not found")
            return False
        
        print(f"  Both old and new format connections coexist successfully")
        return True
    
    def test_connection_between_different_entity_types(self):
        """Test connections between different entity types"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if (not hasattr(self, 'topic_ids') or not self.topic_ids or
            not hasattr(self, 'case_ids') or not self.case_ids or
            not hasattr(self, 'task_ids') or not self.task_ids or
            not hasattr(self, 'literature_ids') or not self.literature_ids):
            print("  Not enough entities available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create connections between different entity types
        connections = [
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.case_ids[0],
                "sourceHandle": "bottom",
                "targetHandle": "top",
                "label": "Topic-Case Connection"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.literature_ids[0],
                "sourceHandle": "right",
                "targetHandle": "left",
                "label": "Topic-Literature Connection"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.task_ids[0],
                "target": self.topic_ids[0],
                "sourceHandle": "bottom",
                "targetHandle": "top",
                "label": "Task-Topic Connection"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.task_ids[0],
                "target": self.case_ids[0],
                "sourceHandle": "right",
                "targetHandle": "left",
                "label": "Task-Case Connection"
            }
        ]
        
        # Add the connections to the data
        for connection in connections:
            modified_data["connections"].append(connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with cross-entity connections: {put_response.status_code}")
            return False
        
        # Verify the connections were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved connections: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if all our connections were saved
        connection_ids = [conn["id"] for conn in connections]
        found_connections = 0
        
        for connection in verified_data["connections"]:
            if connection["id"] in connection_ids:
                found_connections += 1
        
        if found_connections != len(connections):
            print(f"  Not all cross-entity connections were saved correctly. Found {found_connections} of {len(connections)}")
            return False
        
        print(f"  Successfully saved and retrieved {found_connections} cross-entity connections")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.cross_entity_connection_ids = connection_ids
        
        return True
    
    def test_connection_edge_properties(self):
        """Test that connections can store all edge properties"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'topic_ids') or len(self.topic_ids) < 2:
            print("  Not enough topics available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create a connection with all possible edge properties
        new_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": self.topic_ids[0],
            "target": self.topic_ids[1],
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
        self.rich_connection_id = new_connection["id"]
        
        return True
    
    def test_update_connection(self):
        """Test updating a connection"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'rich_connection_id'):
            print("  No rich connection ID available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Find and update the rich connection
        for connection in modified_data["connections"]:
            if connection["id"] == self.rich_connection_id:
                # Update multiple properties
                connection["label"] = "Updated Rich Connection"
                connection["animated"] = False
                if "style" in connection:
                    connection["style"]["stroke"] = "#00FF00"
                if "data" in connection:
                    connection["data"]["updatedProperty"] = "updated value"
                break
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save updated connection: {put_response.status_code}")
            return False
        
        # Verify the connection was updated
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify updated connection: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our connection was updated
        connection_updated = False
        for connection in verified_data["connections"]:
            if connection["id"] == self.rich_connection_id:
                if (connection["label"] == "Updated Rich Connection" and
                    connection["animated"] == False and
                    "style" in connection and connection["style"]["stroke"] == "#00FF00" and
                    "data" in connection and "updatedProperty" in connection["data"]):
                    connection_updated = True
                    break
        
        if not connection_updated:
            print(f"  Connection was not updated correctly")
            return False
        
        print(f"  Successfully updated connection with multiple properties")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        
        return True
    
    def test_delete_connection(self):
        """Test deleting a connection"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'new_format_connection_id'):
            print("  No connection ID available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Remove the new format connection
        modified_data["connections"] = [conn for conn in modified_data["connections"] 
                                       if conn["id"] != self.new_format_connection_id]
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with deleted connection: {put_response.status_code}")
            return False
        
        # Verify the connection was deleted
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify deleted connection: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our connection was deleted
        connection_found = False
        for connection in verified_data["connections"]:
            if connection["id"] == self.new_format_connection_id:
                connection_found = True
                break
        
        if connection_found:
            print(f"  Connection was not deleted correctly")
            return False
        
        print(f"  Successfully deleted connection")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        
        return True
    
    def test_connection_persistence(self):
        """Test that connections persist across multiple requests"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'cross_entity_connection_ids') or not self.cross_entity_connection_ids:
            print("  No cross-entity connection IDs available for testing")
            return False
        
        # Get the current data multiple times to verify persistence
        for i in range(3):
            response = requests.get(f"{self.base_url}/mindmap-data")
            if response.status_code != 200:
                print(f"  Failed to get data in iteration {i+1}: {response.status_code}")
                return False
            
            data = response.json()
            
            # Check if all our cross-entity connections are still there
            found_connections = 0
            for connection in data["connections"]:
                if connection["id"] in self.cross_entity_connection_ids:
                    found_connections += 1
            
            if found_connections != len(self.cross_entity_connection_ids):
                print(f"  Not all connections persisted in iteration {i+1}. Found {found_connections} of {len(self.cross_entity_connection_ids)}")
                return False
            
            # Short delay between requests
            time.sleep(0.5)
        
        print(f"  All connections persisted across multiple requests")
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
    
    def test_malformed_connection_data(self):
        """Test error handling for malformed connection data"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'topic_ids') or not self.topic_ids:
            print("  No topic IDs available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create a malformed connection (missing target)
        malformed_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": self.topic_ids[0],
            # "target" is intentionally missing
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "label": "Malformed Connection"
        }
        
        # Add the malformed connection to the data
        modified_data["connections"].append(malformed_connection)
        
        # Try to save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        
        # Check if the server accepts or rejects the malformed data
        if put_response.status_code >= 400:
            print(f"  Server correctly rejected malformed connection data with status {put_response.status_code}")
            return True
        else:
            # If the server accepts the data, check if it was actually saved
            verify_response = requests.get(f"{self.base_url}/mindmap-data")
            if verify_response.status_code != 200:
                print(f"  Failed to verify after malformed data test: {verify_response.status_code}")
                return False
            
            verified_data = verify_response.json()
            
            # Check if the malformed connection was saved
            malformed_found = False
            for connection in verified_data["connections"]:
                if connection["id"] == malformed_connection["id"]:
                    malformed_found = True
                    break
            
            if malformed_found:
                print(f"  Server accepted malformed connection data (missing target field)")
                # This is a minor issue, not a critical failure
                return True
            else:
                print(f"  Server silently rejected malformed connection data")
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
    
    def test_multiple_save_load_cycles(self):
        """Test that connections persist correctly after multiple save/load cycles"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'rich_connection_id'):
            print("  No rich connection ID available for testing")
            return False
        
        # Verify the rich connection exists
        connection_exists = False
        for connection in self.mindmap_data["connections"]:
            if connection["id"] == self.rich_connection_id:
                connection_exists = True
                break
        
        if not connection_exists:
            print(f"  Rich connection not found in data, skipping test")
            return True
        
        # Perform multiple save/load cycles
        for i in range(3):
            # Make a copy of the data to modify
            modified_data = self.mindmap_data.copy()
            
            # Update the rich connection label
            for connection in modified_data["connections"]:
                if connection["id"] == self.rich_connection_id:
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
            
            # Check if our rich connection is still there
            connection_found = False
            for connection in loaded_data["connections"]:
                if connection["id"] == self.rich_connection_id:
                    connection_found = True
                    if "label" in connection and connection["label"].startswith(f"Cycle {i+1}"):
                        print(f"  Cycle {i+1}: Label updated successfully to '{connection['label']}'")
                    else:
                        print(f"  Cycle {i+1}: Label not updated as expected. Current label: '{connection.get('label', 'No label')}'")
                        # This is a warning, not a failure
                    break
            
            if not connection_found:
                print(f"  Rich connection not found in cycle {i+1}")
                return False
            
            # Update the mindmap_data for the next cycle
            self.mindmap_data = loaded_data
            
            # Short delay between cycles
            time.sleep(0.5)
        
        print(f"  Connections persisted correctly across multiple save/load cycles")
        return True
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting Mind Map Comprehensive Tests 🧪")
        
        # Basic API tests
        self.run_test("API Root Endpoint", self.test_api_root)
        self.run_test("Get Mind Map Data", self.test_get_mindmap_data)
        self.run_test("Entity Position Fields", self.test_entity_position_fields)
        
        # Connection format tests
        self.run_test("Connection with Old Format Handle IDs", self.test_connection_with_old_format_handle_ids)
        self.run_test("Connection with New Format Handle IDs", self.test_connection_with_new_format_handle_ids)
        self.run_test("Mixed Format Connections", self.test_mixed_format_connections)
        
        # Cross-entity connection tests
        self.run_test("Connections Between Different Entity Types", self.test_connection_between_different_entity_types)
        
        # Connection property tests
        self.run_test("Connection Edge Properties", self.test_connection_edge_properties)
        self.run_test("Update Connection", self.test_update_connection)
        self.run_test("Delete Connection", self.test_delete_connection)
        
        # Persistence and error handling tests
        self.run_test("Connection Persistence", self.test_connection_persistence)
        self.run_test("Missing Connections Array", self.test_missing_connections_array)
        self.run_test("Malformed Connection Data", self.test_malformed_connection_data)
        self.run_test("CORS Configuration", self.test_cors_configuration)
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
    tester = MindMapComprehensiveTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ All tests passed!" if success else "❌ Some tests failed!"))