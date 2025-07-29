import requests
import json
import sys
from datetime import datetime

# Use the public endpoint for testing
BASE_URL = "https://3e4d6ba1-ccf6-4dba-a36b-74521b8bcf1a.preview.emergentagent.com/api"

class MindMapAPITester:
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
        
        # Check if we have data in each category
        if len(data['topics']) == 0:
            print("  Warning: No topics found in the data")
        if len(data['cases']) == 0:
            print("  Warning: No cases found in the data")
        if len(data['tasks']) == 0:
            print("  Warning: No tasks found in the data")
        if len(data['literature']) == 0:
            print("  Warning: No literature items found in the data")
            
        return True
    
    def test_topics_data_structure(self):
        """Test that topics have the correct data structure"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not self.mindmap_data.get('topics'):
            print("  No topics available for testing")
            return False
        
        # Check the first topic for required fields
        topic = self.mindmap_data['topics'][0]
        required_fields = ['id', 'title', 'category', 'position']
        
        for field in required_fields:
            if field not in topic:
                print(f"  Topic is missing required field: {field}")
                return False
        
        # Check position structure
        if not isinstance(topic['position'], dict) or not all(key in topic['position'] for key in ['x', 'y']):
            print(f"  Topic position field has incorrect structure: {topic['position']}")
            return False
        
        print(f"  Sample topic: {topic['title']} (ID: {topic['id']})")
        return True
    
    def test_cases_data_structure(self):
        """Test that cases have the correct data structure"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not self.mindmap_data.get('cases'):
            print("  No cases available for testing")
            return False
        
        # Check the first case for required fields
        case = self.mindmap_data['cases'][0]
        required_fields = ['id', 'case_id', 'primary_diagnosis', 'chief_complaint', 'position']
        
        for field in required_fields:
            if field not in case:
                print(f"  Case is missing required field: {field}")
                return False
        
        # Check position structure
        if not isinstance(case['position'], dict) or not all(key in case['position'] for key in ['x', 'y']):
            print(f"  Case position field has incorrect structure: {case['position']}")
            return False
        
        print(f"  Sample case: {case.get('case_id')} (ID: {case['id']})")
        return True
    
    def test_tasks_data_structure(self):
        """Test that tasks have the correct data structure"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not self.mindmap_data.get('tasks'):
            print("  No tasks available for testing")
            return False
        
        # Check the first task for required fields
        task = self.mindmap_data['tasks'][0]
        required_fields = ['id', 'title', 'status', 'position']
        
        for field in required_fields:
            if field not in task:
                print(f"  Task is missing required field: {field}")
                return False
        
        # Check position structure
        if not isinstance(task['position'], dict) or not all(key in task['position'] for key in ['x', 'y']):
            print(f"  Task position field has incorrect structure: {task['position']}")
            return False
        
        print(f"  Sample task: {task['title']} (ID: {task['id']})")
        return True
    
    def test_literature_data_structure(self):
        """Test that literature items have the correct data structure"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not self.mindmap_data.get('literature'):
            print("  No literature items available for testing")
            return False
        
        # Check the first literature item for required fields
        lit = self.mindmap_data['literature'][0]
        required_fields = ['id', 'title', 'position']
        
        for field in required_fields:
            if field not in lit:
                print(f"  Literature item is missing required field: {field}")
                return False
        
        # Check position structure
        if not isinstance(lit['position'], dict) or not all(key in lit['position'] for key in ['x', 'y']):
            print(f"  Literature position field has incorrect structure: {lit['position']}")
            return False
        
        print(f"  Sample literature: {lit['title']} (ID: {lit['id']})")
        return True
    
    def test_connections_data_structure(self):
        """Test that connections have the correct data structure"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        if not self.mindmap_data.get('connections'):
            print("  No connections available for testing")
            return False
        
        # Check the first connection for required fields
        connection = self.mindmap_data['connections'][0]
        required_fields = ['id', 'source', 'target']
        
        for field in required_fields:
            if field not in connection:
                print(f"  Connection is missing required field: {field}")
                return False
        
        # Check for handle fields (may be in old or new format)
        if 'sourceHandle' not in connection:
            print(f"  Connection is missing sourceHandle field")
            return False
        
        if 'targetHandle' not in connection:
            print(f"  Connection is missing targetHandle field")
            return False
        
        print(f"  Sample connection: {connection['id']} (Source: {connection['source']}, Target: {connection['target']})")
        print(f"  Handle format: sourceHandle={connection['sourceHandle']}, targetHandle={connection['targetHandle']}")
        return True
    
    def test_put_mindmap_data(self):
        """Test updating mindmap data"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        # Make a copy of the data to modify
        modified_data = self.mindmap_data.copy()
        
        # Add a test marker to verify the update
        test_marker = f"Test marker {datetime.now().isoformat()}"
        
        # Find a topic to modify
        if modified_data.get('topics') and len(modified_data['topics']) > 0:
            # Add a note to the first topic's description
            topic = modified_data['topics'][0]
            original_description = topic.get('description', '')
            topic['description'] = f"{original_description} {test_marker}"
            
            # Save the modified data
            put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
            if put_response.status_code != 200:
                print(f"  Failed to update mindmap data: {put_response.status_code}")
                return False
            
            # Verify the update
            verify_response = requests.get(f"{self.base_url}/mindmap-data")
            if verify_response.status_code != 200:
                print(f"  Failed to verify updated data: {verify_response.status_code}")
                return False
            
            verified_data = verify_response.json()
            
            # Check if our update was saved
            updated_topic = None
            for t in verified_data['topics']:
                if t['id'] == topic['id']:
                    updated_topic = t
                    break
            
            if not updated_topic:
                print(f"  Could not find the updated topic")
                return False
            
            if test_marker not in updated_topic.get('description', ''):
                print(f"  Topic description was not updated correctly")
                return False
            
            print(f"  Successfully updated and verified topic description")
            
            # Restore the original data
            topic['description'] = original_description
            restore_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
            if restore_response.status_code != 200:
                print(f"  Warning: Failed to restore original data: {restore_response.status_code}")
            
            # Update the mindmap_data for subsequent tests
            self.mindmap_data = modified_data
            
            return True
        else:
            print("  No topics available to test PUT endpoint")
            return False
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting Mind Map API Tests for Rich Text Editor Changes 🧪")
        
        # Basic API tests
        self.run_test("API Root Endpoint", self.test_api_root)
        self.run_test("Get Mind Map Data", self.test_get_mindmap_data)
        
        # Data structure tests
        self.run_test("Topics Data Structure", self.test_topics_data_structure)
        self.run_test("Cases Data Structure", self.test_cases_data_structure)
        self.run_test("Tasks Data Structure", self.test_tasks_data_structure)
        self.run_test("Literature Data Structure", self.test_literature_data_structure)
        self.run_test("Connections Data Structure", self.test_connections_data_structure)
        
        # Update test
        self.run_test("Update Mind Map Data", self.test_put_mindmap_data)
        
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
            return False
        else:
            print("\n✅ All tests passed!")
            return True

if __name__ == "__main__":
    tester = MindMapAPITester(BASE_URL)
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)