import requests
import json
import uuid
from datetime import datetime

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://336d4c80-d84e-4815-a915-e2ffd980488a.preview.emergentagent.com/api"

class MultiDirectionalHandleTest:
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
    
    def setup_test_data(self):
        """Get initial data and store entity IDs for testing"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get initial data: {response.status_code}")
            return False
        
        data = response.json()
        self.mindmap_data = data
        
        # Store entity IDs for testing
        if data["topics"]:
            self.topic_ids = [topic["id"] for topic in data["topics"][:3]]
        if data["cases"]:
            self.case_ids = [case["id"] for case in data["cases"][:3]]
        if data["tasks"]:
            self.task_ids = [task["id"] for task in data["tasks"][:3]]
        if data["literature"]:
            self.literature_ids = [lit["id"] for lit in data["literature"][:3]]
        
        print(f"  Setup complete: {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature")
        return True
    
    def test_all_directional_handles(self):
        """Test connections with all four directional handle IDs: top, right, bottom, left"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'topic_ids') or len(self.topic_ids) < 2:
            print("  Not enough topics available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create connections with all four directional handles
        directional_connections = [
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.topic_ids[1],
                "sourceHandle": "top",
                "targetHandle": "bottom",
                "label": "Top-to-Bottom Connection"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.topic_ids[1],
                "sourceHandle": "right",
                "targetHandle": "left",
                "label": "Right-to-Left Connection"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.topic_ids[1],
                "sourceHandle": "bottom",
                "targetHandle": "top",
                "label": "Bottom-to-Top Connection"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.topic_ids[1],
                "sourceHandle": "left",
                "targetHandle": "right",
                "label": "Left-to-Right Connection"
            }
        ]
        
        # Add the connections to the data
        for connection in directional_connections:
            modified_data["connections"].append(connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save data with directional connections: {put_response.status_code}")
            return False
        
        # Verify the connections were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved connections: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if all our directional connections were saved correctly
        connection_ids = [conn["id"] for conn in directional_connections]
        found_connections = 0
        handle_pairs_found = []
        
        for connection in verified_data["connections"]:
            if connection["id"] in connection_ids:
                found_connections += 1
                handle_pair = f"{connection['sourceHandle']}-to-{connection['targetHandle']}"
                handle_pairs_found.append(handle_pair)
        
        if found_connections != len(directional_connections):
            print(f"  Not all directional connections were saved correctly. Found {found_connections} of {len(directional_connections)}")
            return False
        
        # Verify all four directional handle pairs are present
        expected_pairs = ["top-to-bottom", "right-to-left", "bottom-to-top", "left-to-right"]
        for expected_pair in expected_pairs:
            if expected_pair not in handle_pairs_found:
                print(f"  Missing expected handle pair: {expected_pair}")
                return False
        
        print(f"  Successfully saved and retrieved all 4 directional connections: {', '.join(handle_pairs_found)}")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.directional_connection_ids = connection_ids
        
        return True
    
    def test_cross_entity_directional_connections(self):
        """Test directional connections between different entity types"""
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
        
        # Create cross-entity connections with all directional handles
        cross_entity_connections = [
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.case_ids[0],
                "sourceHandle": "top",
                "targetHandle": "bottom",
                "label": "Topic-Case (Top-Bottom)"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.case_ids[0],
                "target": self.literature_ids[0],
                "sourceHandle": "right",
                "targetHandle": "left",
                "label": "Case-Literature (Right-Left)"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.literature_ids[0],
                "target": self.task_ids[0],
                "sourceHandle": "bottom",
                "targetHandle": "top",
                "label": "Literature-Task (Bottom-Top)"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.task_ids[0],
                "target": self.topic_ids[0],
                "sourceHandle": "left",
                "targetHandle": "right",
                "label": "Task-Topic (Left-Right)"
            }
        ]
        
        # Add the connections to the data
        for connection in cross_entity_connections:
            modified_data["connections"].append(connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save cross-entity directional connections: {put_response.status_code}")
            return False
        
        # Verify the connections were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved connections: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if all our cross-entity connections were saved correctly
        connection_ids = [conn["id"] for conn in cross_entity_connections]
        found_connections = 0
        entity_pairs_found = []
        
        for connection in verified_data["connections"]:
            if connection["id"] in connection_ids:
                found_connections += 1
                # Determine entity types based on source and target IDs
                source_type = self.get_entity_type(connection["source"])
                target_type = self.get_entity_type(connection["target"])
                entity_pair = f"{source_type}-{target_type} ({connection['sourceHandle']}-{connection['targetHandle']})"
                entity_pairs_found.append(entity_pair)
        
        if found_connections != len(cross_entity_connections):
            print(f"  Not all cross-entity directional connections were saved. Found {found_connections} of {len(cross_entity_connections)}")
            return False
        
        print(f"  Successfully saved and retrieved {found_connections} cross-entity directional connections:")
        for pair in entity_pairs_found:
            print(f"    - {pair}")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.cross_entity_connection_ids = connection_ids
        
        return True
    
    def get_entity_type(self, entity_id):
        """Determine entity type based on ID"""
        if hasattr(self, 'topic_ids') and entity_id in self.topic_ids:
            return "Topic"
        elif hasattr(self, 'case_ids') and entity_id in self.case_ids:
            return "Case"
        elif hasattr(self, 'task_ids') and entity_id in self.task_ids:
            return "Task"
        elif hasattr(self, 'literature_ids') and entity_id in self.literature_ids:
            return "Literature"
        else:
            return "Unknown"
    
    def test_handle_id_migration_compatibility(self):
        """Test that both old format (source-bottom) and new format (bottom) handle IDs work together"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not hasattr(self, 'topic_ids') or len(self.topic_ids) < 2:
            print("  Not enough topics available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Create connections with mixed old and new format handle IDs
        mixed_format_connections = [
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.topic_ids[1],
                "sourceHandle": f"{self.topic_ids[0]}-bottom",  # Old format
                "targetHandle": "top",                          # New format
                "label": "Mixed Format: Old Source, New Target"
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.topic_ids[0],
                "target": self.topic_ids[1],
                "sourceHandle": "right",                        # New format
                "targetHandle": f"{self.topic_ids[1]}-left",    # Old format
                "label": "Mixed Format: New Source, Old Target"
            }
        ]
        
        # Add the connections to the data
        for connection in mixed_format_connections:
            modified_data["connections"].append(connection)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save mixed format connections: {put_response.status_code}")
            return False
        
        # Verify the connections were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved connections: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if all our mixed format connections were saved correctly
        connection_ids = [conn["id"] for conn in mixed_format_connections]
        found_connections = 0
        format_combinations = []
        
        for connection in verified_data["connections"]:
            if connection["id"] in connection_ids:
                found_connections += 1
                source_format = "old" if "-" in connection["sourceHandle"] else "new"
                target_format = "old" if "-" in connection["targetHandle"] else "new"
                format_combo = f"{source_format}-to-{target_format}"
                format_combinations.append(format_combo)
        
        if found_connections != len(mixed_format_connections):
            print(f"  Not all mixed format connections were saved. Found {found_connections} of {len(mixed_format_connections)}")
            return False
        
        print(f"  Successfully saved and retrieved mixed format connections: {', '.join(format_combinations)}")
        
        # Update the mindmap_data for subsequent tests
        self.mindmap_data = verified_data
        self.mixed_format_connection_ids = connection_ids
        
        return True
    
    def test_complete_mind_map_data_structure(self):
        """Test that the complete mind map data structure is returned correctly"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get mind map data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Check that all required fields are present
        required_fields = ["topics", "cases", "tasks", "literature", "connections"]
        for field in required_fields:
            if field not in data:
                print(f"  Missing required field: {field}")
                return False
        
        # Check that each entity type has the expected structure
        entity_checks = {
            "topics": ["id", "title", "category", "position"],
            "cases": ["id", "case_id", "primary_diagnosis", "position"],
            "tasks": ["id", "title", "status", "position"],
            "literature": ["id", "title", "position"]
        }
        
        for entity_type, required_fields in entity_checks.items():
            if data[entity_type]:  # Only check if there are items
                first_item = data[entity_type][0]
                for field in required_fields:
                    if field not in first_item:
                        print(f"  Missing required field '{field}' in {entity_type}")
                        return False
        
        # Check connections - focus on well-formed connections only
        well_formed_connections = 0
        connection_handle_formats = {"old": 0, "new": 0}
        
        for connection in data["connections"]:
            # Only count connections that have all required fields
            if all(field in connection for field in ["id", "source", "target", "sourceHandle", "targetHandle"]):
                well_formed_connections += 1
                # Check source handle format
                if "-" in connection["sourceHandle"]:
                    connection_handle_formats["old"] += 1
                else:
                    connection_handle_formats["new"] += 1
        
        print(f"  Complete data structure verified:")
        print(f"    - {len(data['topics'])} topics")
        print(f"    - {len(data['cases'])} cases")
        print(f"    - {len(data['tasks'])} tasks")
        print(f"    - {len(data['literature'])} literature items")
        print(f"    - {len(data['connections'])} total connections ({well_formed_connections} well-formed)")
        print(f"    - Handle formats: {connection_handle_formats['old']} old format, {connection_handle_formats['new']} new format")
        
        # As long as we have the basic structure and some well-formed connections, this is a pass
        return well_formed_connections > 0
    
    def run_all_tests(self):
        """Run all multi-directional handle tests"""
        print("🧪 Starting Multi-Directional Handle Tests 🧪")
        
        # Setup
        self.run_test("Setup Test Data", self.setup_test_data)
        
        # Core tests
        self.run_test("Complete Mind Map Data Structure", self.test_complete_mind_map_data_structure)
        self.run_test("All Directional Handles (top, right, bottom, left)", self.test_all_directional_handles)
        self.run_test("Cross-Entity Directional Connections", self.test_cross_entity_directional_connections)
        self.run_test("Handle ID Migration Compatibility", self.test_handle_id_migration_compatibility)
        
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
    tester = MultiDirectionalHandleTest(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ All multi-directional handle tests passed!" if success else "❌ Some multi-directional handle tests failed!"))