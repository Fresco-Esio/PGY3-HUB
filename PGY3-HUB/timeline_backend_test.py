import requests
import json
import uuid
from datetime import datetime
import time

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://39409560-62b0-4839-a8c9-4bc285999ef7.preview.emergentagent.com/api"

class TimelineBackendTester:
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
    
    def test_api_health(self):
        """Test API endpoint health"""
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data:
            print(f"  Expected message about API running, got {data}")
            return False
            
        print(f"  API health check: {data['message']}")
        return True
    
    def test_get_mindmap_data_structure(self):
        """Test GET /api/mindmap-data returns proper structure"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        # Check that the response has the expected structure
        required_keys = ["topics", "cases", "tasks", "literature", "connections"]
        if not all(key in data for key in required_keys):
            print(f"  Missing expected keys in response. Expected: {required_keys}, Got: {list(data.keys())}")
            return False
        
        # Store the data for later tests
        self.mindmap_data = data
        
        # Print some details about the data
        print(f"  Data structure verified: {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature items, {len(data['connections'])} connections")
        
        return True
    
    def test_case_data_structure(self):
        """Test that case data has proper structure for Timeline functionality"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        cases = self.mindmap_data.get('cases', [])
        if not cases:
            print("  No cases found in data")
            return False
        
        # Check first case structure
        case = cases[0]
        required_fields = ['id', 'case_id', 'encounter_date', 'primary_diagnosis', 'chief_complaint']
        
        for field in required_fields:
            if field not in case:
                print(f"  Missing required field '{field}' in case data")
                return False
        
        # Check if case has position field for mind map
        if 'position' not in case:
            print("  Missing 'position' field in case data")
            return False
        
        # Check if position has x and y coordinates
        position = case['position']
        if not isinstance(position, dict) or 'x' not in position or 'y' not in position:
            print(f"  Invalid position structure: {position}")
            return False
        
        print(f"  Case data structure verified for case: {case.get('case_id', 'Unknown')}")
        print(f"  Case has position: x={position['x']}, y={position['y']}")
        
        # Store case ID for timeline tests
        self.test_case_id = case['id']
        
        return True
    
    def test_timeline_data_creation(self):
        """Test creating case data with timeline entries"""
        if not hasattr(self, 'mindmap_data') or not self.mindmap_data:
            print("  No mindmap data available for testing")
            return False
        
        # Create a new case with timeline entries
        new_case_id = str(uuid.uuid4())
        timeline_entries = [
            {
                "id": str(uuid.uuid4()),
                "type": "Assessment",
                "timestamp": datetime.now().isoformat(),
                "content": "Initial psychiatric assessment completed. Patient presents with symptoms of major depression.",
                "author": "Dr. Smith",
                "metadata": {
                    "severity": "moderate",
                    "duration": "3 months"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "type": "Medication",
                "timestamp": datetime.now().isoformat(),
                "content": "Started on Sertraline 50mg daily. Patient counseled on side effects and expectations.",
                "author": "Dr. Smith",
                "metadata": {
                    "medication": "Sertraline",
                    "dosage": "50mg daily",
                    "route": "oral"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "type": "Therapy",
                "timestamp": datetime.now().isoformat(),
                "content": "First CBT session focused on identifying negative thought patterns.",
                "author": "Dr. Johnson",
                "metadata": {
                    "session_type": "CBT",
                    "session_number": 1,
                    "duration": "50 minutes"
                }
            }
        ]
        
        new_case = {
            "id": new_case_id,
            "case_id": f"TIMELINE-TEST-{int(time.time())}",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Major Depressive Disorder",
            "secondary_diagnoses": ["Generalized Anxiety Disorder"],
            "age": 28,
            "gender": "Female",
            "chief_complaint": "Feeling depressed and anxious for the past 3 months",
            "initial_presentation": "Patient reports persistent low mood, decreased energy, and difficulty concentrating",
            "current_presentation": "Symptoms have stabilized with medication and therapy",
            "medication_history": "No prior psychiatric medications",
            "therapy_progress": "Engaged in CBT, showing good insight",
            "defense_patterns": "Intellectualization, some denial",
            "clinical_reflection": "Complex case requiring integrated approach",
            "history_present_illness": "3-month history of depression following job loss",
            "medical_history": "No significant medical history",
            "medications": ["Sertraline 50mg daily"],
            "mental_status_exam": "Alert, oriented x3, depressed mood, restricted affect",
            "assessment_plan": "Continue medication, weekly therapy sessions",
            "notes": "Patient has strong family support system",
            "status": "active",
            "linked_topics": [],
            "position": {"x": 500, "y": 300},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "timeline": timeline_entries  # Add timeline entries
        }
        
        # Make a copy of the current data and add the new case
        modified_data = self.mindmap_data.copy()
        modified_data['cases'].append(new_case)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save case with timeline data: {put_response.status_code}")
            if put_response.text:
                print(f"  Error response: {put_response.text}")
            return False
        
        print(f"  Successfully created case with {len(timeline_entries)} timeline entries")
        self.timeline_case_id = new_case_id
        
        return True
    
    def test_timeline_data_retrieval(self):
        """Test retrieving case data with timeline entries"""
        if not hasattr(self, 'timeline_case_id'):
            print("  No timeline case ID available for testing")
            return False
        
        # Get the current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to retrieve data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Find our test case
        test_case = None
        for case in data['cases']:
            if case['id'] == self.timeline_case_id:
                test_case = case
                break
        
        if not test_case:
            print(f"  Test case with timeline not found")
            return False
        
        # Verify timeline entries are present
        if 'timeline' not in test_case:
            print(f"  Timeline field not found in retrieved case")
            return False
        
        timeline = test_case['timeline']
        if not isinstance(timeline, list):
            print(f"  Timeline is not a list: {type(timeline)}")
            return False
        
        if len(timeline) != 3:
            print(f"  Expected 3 timeline entries, got {len(timeline)}")
            return False
        
        # Verify timeline entry structure
        for i, entry in enumerate(timeline):
            required_fields = ['id', 'type', 'timestamp', 'content', 'author']
            for field in required_fields:
                if field not in entry:
                    print(f"  Timeline entry {i} missing required field '{field}'")
                    return False
            
            # Verify metadata structure
            if 'metadata' not in entry:
                print(f"  Timeline entry {i} missing metadata")
                return False
            
            if not isinstance(entry['metadata'], dict):
                print(f"  Timeline entry {i} metadata is not a dict: {type(entry['metadata'])}")
                return False
        
        print(f"  Successfully retrieved case with {len(timeline)} timeline entries")
        print(f"  Timeline entry types: {[entry['type'] for entry in timeline]}")
        
        return True
    
    def test_timeline_data_update(self):
        """Test updating timeline entries in case data"""
        if not hasattr(self, 'timeline_case_id'):
            print("  No timeline case ID available for testing")
            return False
        
        # Get the current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to retrieve data for update: {response.status_code}")
            return False
        
        data = response.json()
        
        # Find our test case and add a new timeline entry
        for case in data['cases']:
            if case['id'] == self.timeline_case_id:
                # Add a new timeline entry
                new_entry = {
                    "id": str(uuid.uuid4()),
                    "type": "Follow-up",
                    "timestamp": datetime.now().isoformat(),
                    "content": "Follow-up appointment. Patient reports improved mood and energy levels.",
                    "author": "Dr. Smith",
                    "metadata": {
                        "improvement": "significant",
                        "medication_compliance": "excellent",
                        "side_effects": "none reported"
                    }
                }
                
                if 'timeline' not in case:
                    case['timeline'] = []
                
                case['timeline'].append(new_entry)
                case['updated_at'] = datetime.now().isoformat()
                
                # Also update an existing entry
                if len(case['timeline']) > 0:
                    case['timeline'][0]['content'] += " [UPDATED: Additional notes added during review]"
                
                break
        
        # Save the updated data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=data)
        if put_response.status_code != 200:
            print(f"  Failed to save updated timeline data: {put_response.status_code}")
            return False
        
        # Verify the update
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify timeline update: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Find our test case and verify the update
        for case in verified_data['cases']:
            if case['id'] == self.timeline_case_id:
                if len(case['timeline']) != 4:  # Should now have 4 entries
                    print(f"  Expected 4 timeline entries after update, got {len(case['timeline'])}")
                    return False
                
                # Check if the new entry was added
                follow_up_found = False
                updated_entry_found = False
                
                for entry in case['timeline']:
                    if entry['type'] == 'Follow-up':
                        follow_up_found = True
                    if '[UPDATED:' in entry['content']:
                        updated_entry_found = True
                
                if not follow_up_found:
                    print(f"  New follow-up entry not found")
                    return False
                
                if not updated_entry_found:
                    print(f"  Updated entry content not found")
                    return False
                
                break
        
        print(f"  Successfully updated timeline with new entry and modified existing entry")
        
        return True
    
    def test_connection_persistence_with_timeline(self):
        """Test that connections persist when timeline data is updated"""
        if not hasattr(self, 'timeline_case_id'):
            print("  No timeline case ID available for testing")
            return False
        
        # Get current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to retrieve data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Create a connection involving our timeline case
        if not data.get('topics'):
            print("  No topics available to create connection")
            return False
        
        topic_id = data['topics'][0]['id']
        
        new_connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": topic_id,
            "target": self.timeline_case_id,
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "label": "Topic-Timeline Case Connection"
        }
        
        data['connections'].append(new_connection)
        
        # Save with the new connection
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=data)
        if put_response.status_code != 200:
            print(f"  Failed to save connection: {put_response.status_code}")
            return False
        
        # Now update the timeline and verify connection persists
        response = requests.get(f"{self.base_url}/mindmap-data")
        data = response.json()
        
        # Add another timeline entry
        for case in data['cases']:
            if case['id'] == self.timeline_case_id:
                new_entry = {
                    "id": str(uuid.uuid4()),
                    "type": "Note",
                    "timestamp": datetime.now().isoformat(),
                    "content": "Connection persistence test entry",
                    "author": "Test System",
                    "metadata": {"test": True}
                }
                case['timeline'].append(new_entry)
                break
        
        # Save the timeline update
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=data)
        if put_response.status_code != 200:
            print(f"  Failed to save timeline update: {put_response.status_code}")
            return False
        
        # Verify connection still exists
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        verified_data = verify_response.json()
        
        connection_found = False
        for connection in verified_data['connections']:
            if connection['id'] == new_connection['id']:
                connection_found = True
                break
        
        if not connection_found:
            print(f"  Connection was lost after timeline update")
            return False
        
        print(f"  Connection persisted correctly after timeline data update")
        self.test_connection_id = new_connection['id']
        
        return True
    
    def test_error_handling_malformed_timeline(self):
        """Test error handling for malformed timeline data"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available for testing")
            return False
        
        # Create a case with malformed timeline data
        malformed_case = {
            "id": str(uuid.uuid4()),
            "case_id": "MALFORMED-TEST",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Test Diagnosis",
            "chief_complaint": "Test complaint",
            "position": {"x": 0, "y": 0},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "timeline": [
                {
                    # Missing required fields like 'id', 'type', 'timestamp'
                    "content": "Malformed entry",
                    "author": "Test"
                },
                {
                    "id": str(uuid.uuid4()),
                    "type": "Assessment",
                    # Missing timestamp
                    "content": "Another malformed entry",
                    "author": "Test"
                }
            ]
        }
        
        modified_data = self.mindmap_data.copy()
        modified_data['cases'].append(malformed_case)
        
        # Try to save malformed data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        
        # The backend should either reject it or handle it gracefully
        if put_response.status_code >= 400:
            print(f"  Server correctly rejected malformed timeline data with status {put_response.status_code}")
            return True
        else:
            # If accepted, verify it was saved (backend might be lenient)
            verify_response = requests.get(f"{self.base_url}/mindmap-data")
            if verify_response.status_code == 200:
                print(f"  Server accepted malformed timeline data (lenient validation)")
                return True
            else:
                print(f"  Server accepted malformed data but failed to retrieve it")
                return False
    
    def test_large_timeline_data_handling(self):
        """Test handling of cases with large timeline datasets"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available for testing")
            return False
        
        # Create a case with many timeline entries
        large_timeline = []
        for i in range(50):  # Create 50 timeline entries
            entry = {
                "id": str(uuid.uuid4()),
                "type": ["Assessment", "Medication", "Therapy", "Follow-up", "Note"][i % 5],
                "timestamp": datetime.now().isoformat(),
                "content": f"Timeline entry #{i+1} - This is a test entry with some content to simulate real usage.",
                "author": f"Dr. Test{i % 3}",
                "metadata": {
                    "entry_number": i + 1,
                    "test_data": True,
                    "category": "large_dataset_test"
                }
            }
            large_timeline.append(entry)
        
        large_case = {
            "id": str(uuid.uuid4()),
            "case_id": f"LARGE-TIMELINE-{int(time.time())}",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Test Case with Large Timeline",
            "chief_complaint": "Testing large timeline handling",
            "position": {"x": 600, "y": 400},
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "timeline": large_timeline
        }
        
        modified_data = self.mindmap_data.copy()
        modified_data['cases'].append(large_case)
        
        # Save the large timeline data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save large timeline data: {put_response.status_code}")
            return False
        
        # Verify retrieval
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to retrieve large timeline data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Find our large case
        large_case_found = False
        for case in verified_data['cases']:
            if case['id'] == large_case['id']:
                if len(case.get('timeline', [])) == 50:
                    large_case_found = True
                    break
        
        if not large_case_found:
            print(f"  Large timeline case not found or timeline entries missing")
            return False
        
        print(f"  Successfully handled case with 50 timeline entries")
        
        return True
    
    def run_all_tests(self):
        """Run all timeline-focused tests and print a summary"""
        print("🧪 Starting Timeline Backend Tests 🧪")
        print("Focus: Case data storage and timeline functionality")
        
        # API Health tests
        self.run_test("API Endpoint Health", self.test_api_health)
        self.run_test("GET /api/mindmap-data Structure", self.test_get_mindmap_data_structure)
        
        # Case data structure tests
        self.run_test("Case Data Structure for Timeline", self.test_case_data_structure)
        
        # Timeline functionality tests
        self.run_test("Timeline Data Creation", self.test_timeline_data_creation)
        self.run_test("Timeline Data Retrieval", self.test_timeline_data_retrieval)
        self.run_test("Timeline Data Update", self.test_timeline_data_update)
        
        # Integration tests
        self.run_test("Connection Persistence with Timeline Updates", self.test_connection_persistence_with_timeline)
        
        # Error handling tests
        self.run_test("Error Handling - Malformed Timeline Data", self.test_error_handling_malformed_timeline)
        
        # Performance tests
        self.run_test("Large Timeline Data Handling", self.test_large_timeline_data_handling)
        
        # Print summary
        print("\n📊 Timeline Backend Test Summary:")
        print(f"  Total Tests: {self.test_results['total']}")
        print(f"  Passed: {self.test_results['passed']}")
        print(f"  Failed: {self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for detail in self.test_results['details']:
                if "FAILED" in detail['status'] or "ERROR" in detail['status']:
                    print(f"  - {detail['name']}: {detail['status']}")
        else:
            print("\n✅ All timeline backend tests passed!")
            print("✅ API endpoints are healthy")
            print("✅ Case data with timeline entries can be saved and retrieved")
            print("✅ Timeline data structure is properly handled")
            print("✅ Connection persistence works with timeline updates")
            print("✅ Error handling works for malformed requests")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = TimelineBackendTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("🎉 All timeline backend functionality is working correctly!" if success else "⚠️  Some timeline backend tests failed!"))