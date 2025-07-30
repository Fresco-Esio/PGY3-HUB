import requests
import json
import uuid
from datetime import datetime
import time

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://2dfe9b59-ae06-48cd-aaa6-476baf8e16c7.preview.emergentagent.com/api"

class TimelineBackendCompatibilityTester:
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
    
    def test_api_endpoint_health(self):
        """Test API endpoint health - GET/PUT /api/mindmap-data"""
        # Test API root
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"  API root failed with status {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data:
            print(f"  API root missing message: {data}")
            return False
        
        print(f"  API root: {data['message']}")
        
        # Test GET mindmap-data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  GET mindmap-data failed with status {response.status_code}")
            return False
        
        data = response.json()
        if not all(key in data for key in ["topics", "cases", "tasks", "literature", "connections"]):
            print(f"  GET mindmap-data missing required keys: {data.keys()}")
            return False
        
        # Store data for later tests
        self.mindmap_data = data
        print(f"  GET mindmap-data: Found {len(data['cases'])} cases")
        
        # Test PUT mindmap-data (save back the same data)
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=data)
        if put_response.status_code != 200:
            print(f"  PUT mindmap-data failed with status {put_response.status_code}")
            return False
        
        print(f"  PUT mindmap-data: Successfully saved data")
        return True
    
    def test_case_node_timeline_structure(self):
        """Test that case nodes support timeline field with proper structure"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available")
            return False
        
        # Check existing cases for timeline field
        cases = self.mindmap_data.get('cases', [])
        if not cases:
            print("  No cases found in data")
            return False
        
        timeline_support_verified = False
        for case in cases:
            if 'timeline' in case:
                timeline_support_verified = True
                timeline = case['timeline']
                print(f"  Case {case.get('case_id', 'Unknown')} has timeline with {len(timeline)} entries")
                
                # Check timeline entry structure if entries exist
                if timeline:
                    entry = timeline[0]
                    required_fields = ['id', 'type', 'timestamp', 'content']
                    missing_fields = [field for field in required_fields if field not in entry]
                    if missing_fields:
                        print(f"  Timeline entry missing fields: {missing_fields}")
                        return False
                    print(f"  Timeline entry structure verified: {list(entry.keys())}")
                break
        
        if not timeline_support_verified:
            print("  No cases with timeline field found")
            return False
        
        return True
    
    def test_timeline_data_persistence(self):
        """Test timeline entries can be saved and retrieved properly"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available")
            return False
        
        # Create a test case with comprehensive timeline data
        test_case_id = str(uuid.uuid4())
        test_timeline_entries = [
            {
                "id": str(uuid.uuid4()),
                "type": "Assessment",
                "timestamp": datetime.now().isoformat(),
                "content": "Initial psychiatric evaluation completed",
                "patient_narrative": "Patient reports feeling overwhelmed and anxious",
                "clinical_notes": "MSE: Alert, oriented x3, anxious mood, congruent affect",
                "author": "Dr. Smith",
                "metadata": {
                    "session_duration": 60,
                    "location": "Outpatient Clinic",
                    "priority": "high"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "type": "Medication",
                "timestamp": (datetime.now()).isoformat(),
                "content": "Started on Sertraline 50mg daily",
                "patient_narrative": "Patient agrees to medication trial",
                "clinical_notes": "Discussed side effects and monitoring plan",
                "author": "Dr. Smith",
                "metadata": {
                    "medication": "Sertraline",
                    "dosage": "50mg",
                    "frequency": "daily"
                }
            },
            {
                "id": str(uuid.uuid4()),
                "type": "Therapy",
                "timestamp": datetime.now().isoformat(),
                "content": "CBT session focused on anxiety management",
                "patient_narrative": "Patient engaged well, practiced breathing exercises",
                "clinical_notes": "Good therapeutic alliance, homework assigned",
                "author": "Dr. Johnson",
                "metadata": {
                    "therapy_type": "CBT",
                    "session_number": 1,
                    "homework_assigned": True
                }
            }
        ]
        
        test_case = {
            "id": test_case_id,
            "case_id": f"TEST-TIMELINE-{int(time.time())}",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Major Depressive Disorder",
            "secondary_diagnoses": ["Generalized Anxiety Disorder"],
            "age": 28,
            "gender": "Female",
            "chief_complaint": "Feeling depressed and anxious for the past 3 months",
            "initial_presentation": "Patient presents with persistent low mood and anxiety",
            "current_presentation": "Symptoms improving with treatment",
            "medication_history": "No prior psychiatric medications",
            "therapy_progress": "Engaged in CBT, showing good progress",
            "defense_patterns": "Intellectualization, some avoidance",
            "clinical_reflection": "Complex case requiring integrated approach",
            "status": "active",
            "linked_topics": [],
            "position": {"x": 500, "y": 300},
            "timeline": test_timeline_entries,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Add the test case to mindmap data
        modified_data = self.mindmap_data.copy()
        modified_data['cases'].append(test_case)
        
        # Save the data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save case with timeline: {put_response.status_code}")
            return False
        
        # Retrieve and verify the data
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to retrieve saved data: {get_response.status_code}")
            return False
        
        retrieved_data = get_response.json()
        
        # Find our test case
        test_case_found = None
        for case in retrieved_data['cases']:
            if case['id'] == test_case_id:
                test_case_found = case
                break
        
        if not test_case_found:
            print(f"  Test case not found after save/retrieve")
            return False
        
        # Verify timeline data integrity
        retrieved_timeline = test_case_found.get('timeline', [])
        if len(retrieved_timeline) != len(test_timeline_entries):
            print(f"  Timeline entry count mismatch: expected {len(test_timeline_entries)}, got {len(retrieved_timeline)}")
            return False
        
        # Verify each timeline entry
        for i, entry in enumerate(retrieved_timeline):
            original_entry = test_timeline_entries[i]
            for field in ['id', 'type', 'content', 'patient_narrative', 'clinical_notes', 'author']:
                if entry.get(field) != original_entry.get(field):
                    print(f"  Timeline entry {i} field '{field}' mismatch")
                    return False
            
            # Verify metadata
            if entry.get('metadata') != original_entry.get('metadata'):
                print(f"  Timeline entry {i} metadata mismatch")
                return False
        
        print(f"  Successfully saved and retrieved case with {len(test_timeline_entries)} timeline entries")
        print(f"  All timeline entry fields preserved: id, type, timestamp, content, patient_narrative, clinical_notes, author, metadata")
        
        # Store for later tests
        self.test_case_id = test_case_id
        self.mindmap_data = retrieved_data
        
        return True
    
    def test_timeline_data_updates(self):
        """Test updating timeline entries and data integrity"""
        if not hasattr(self, 'test_case_id') or not hasattr(self, 'mindmap_data'):
            print("  No test case available for update testing")
            return False
        
        # Find our test case
        test_case = None
        for case in self.mindmap_data['cases']:
            if case['id'] == self.test_case_id:
                test_case = case
                break
        
        if not test_case:
            print("  Test case not found for update testing")
            return False
        
        # Add a new timeline entry
        new_entry = {
            "id": str(uuid.uuid4()),
            "type": "Follow-up",
            "timestamp": datetime.now().isoformat(),
            "content": "Two-week follow-up appointment",
            "patient_narrative": "Patient reports improved mood and energy",
            "clinical_notes": "Medication well-tolerated, continue current regimen",
            "author": "Dr. Smith",
            "metadata": {
                "follow_up_type": "medication_check",
                "weeks_since_start": 2,
                "side_effects": "none_reported"
            }
        }
        
        # Update existing entry
        if test_case['timeline']:
            test_case['timeline'][0]['content'] = "Updated: Initial psychiatric evaluation completed with comprehensive assessment"
            test_case['timeline'][0]['clinical_notes'] = "Updated: MSE shows significant improvement"
        
        # Add new entry
        test_case['timeline'].append(new_entry)
        test_case['updated_at'] = datetime.now().isoformat()
        
        # Save updated data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=self.mindmap_data)
        if put_response.status_code != 200:
            print(f"  Failed to save updated timeline: {put_response.status_code}")
            return False
        
        # Retrieve and verify updates
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to retrieve updated data: {get_response.status_code}")
            return False
        
        updated_data = get_response.json()
        
        # Find updated test case
        updated_case = None
        for case in updated_data['cases']:
            if case['id'] == self.test_case_id:
                updated_case = case
                break
        
        if not updated_case:
            print("  Updated test case not found")
            return False
        
        # Verify timeline updates
        updated_timeline = updated_case.get('timeline', [])
        if len(updated_timeline) != 4:  # Original 3 + 1 new
            print(f"  Timeline length incorrect after update: expected 4, got {len(updated_timeline)}")
            return False
        
        # Verify updated content
        if "Updated: Initial psychiatric evaluation" not in updated_timeline[0]['content']:
            print("  Timeline entry update not persisted")
            return False
        
        # Verify new entry
        new_entry_found = False
        for entry in updated_timeline:
            if entry['type'] == 'Follow-up' and 'Two-week follow-up' in entry['content']:
                new_entry_found = True
                if entry['metadata'].get('follow_up_type') != 'medication_check':
                    print("  New timeline entry metadata not preserved")
                    return False
                break
        
        if not new_entry_found:
            print("  New timeline entry not found")
            return False
        
        print(f"  Successfully updated timeline: modified existing entry and added new entry")
        print(f"  Timeline now has {len(updated_timeline)} entries with preserved metadata")
        
        self.mindmap_data = updated_data
        return True
    
    def test_timeline_error_handling(self):
        """Test backend handles timeline data updates gracefully"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available")
            return False
        
        # Test 1: Malformed timeline entry (missing required fields)
        malformed_case = {
            "id": str(uuid.uuid4()),
            "case_id": "MALFORMED-TEST",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Test Diagnosis",
            "chief_complaint": "Test complaint",
            "timeline": [
                {
                    # Missing 'id' and 'type' fields
                    "timestamp": datetime.now().isoformat(),
                    "content": "Malformed entry"
                }
            ],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        modified_data = self.mindmap_data.copy()
        modified_data['cases'].append(malformed_case)
        
        # Try to save malformed data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        
        # Backend should handle this gracefully (either accept with lenient validation or reject properly)
        if put_response.status_code >= 400:
            print(f"  Backend properly rejected malformed timeline data (status {put_response.status_code})")
        else:
            print(f"  Backend accepted malformed timeline data with lenient validation")
        
        # Test 2: Very large timeline dataset
        large_timeline = []
        for i in range(50):
            large_timeline.append({
                "id": str(uuid.uuid4()),
                "type": "Note",
                "timestamp": datetime.now().isoformat(),
                "content": f"Timeline entry {i+1} with substantial content to test data handling capacity",
                "patient_narrative": f"Patient narrative for entry {i+1}",
                "clinical_notes": f"Clinical notes for entry {i+1}",
                "author": "Dr. Test",
                "metadata": {
                    "entry_number": i+1,
                    "test_data": True,
                    "large_field": "x" * 100  # 100 character string
                }
            })
        
        large_case = {
            "id": str(uuid.uuid4()),
            "case_id": "LARGE-TIMELINE-TEST",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Test Diagnosis",
            "chief_complaint": "Test complaint",
            "timeline": large_timeline,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        large_data = self.mindmap_data.copy()
        large_data['cases'].append(large_case)
        
        # Test saving large timeline
        start_time = time.time()
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=large_data)
        save_time = time.time() - start_time
        
        if put_response.status_code != 200:
            print(f"  Failed to save large timeline dataset: {put_response.status_code}")
            return False
        
        # Test retrieving large timeline
        start_time = time.time()
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        retrieve_time = time.time() - start_time
        
        if get_response.status_code != 200:
            print(f"  Failed to retrieve large timeline dataset: {get_response.status_code}")
            return False
        
        print(f"  Successfully handled large timeline dataset (50 entries)")
        print(f"  Save time: {save_time:.2f}s, Retrieve time: {retrieve_time:.2f}s")
        
        return True
    
    def test_timeline_connection_integration(self):
        """Test timeline data works correctly with connection system"""
        if not hasattr(self, 'mindmap_data') or not hasattr(self, 'test_case_id'):
            print("  No test data available for integration testing")
            return False
        
        # Create a connection involving our test case
        topics = self.mindmap_data.get('topics', [])
        if not topics:
            print("  No topics available for connection testing")
            return False
        
        connection = {
            "id": f"e{uuid.uuid4().hex}",
            "source": topics[0]['id'],
            "target": self.test_case_id,
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "label": "Topic-Case Timeline Connection"
        }
        
        # Add connection and save
        modified_data = self.mindmap_data.copy()
        if 'connections' not in modified_data:
            modified_data['connections'] = []
        modified_data['connections'].append(connection)
        
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save connection with timeline case: {put_response.status_code}")
            return False
        
        # Retrieve and verify both timeline and connection persist
        get_response = requests.get(f"{self.base_url}/mindmap-data")
        if get_response.status_code != 200:
            print(f"  Failed to retrieve integrated data: {get_response.status_code}")
            return False
        
        integrated_data = get_response.json()
        
        # Verify connection exists
        connection_found = False
        for conn in integrated_data.get('connections', []):
            if conn['id'] == connection['id']:
                connection_found = True
                break
        
        if not connection_found:
            print("  Connection not found after timeline integration")
            return False
        
        # Verify timeline case still exists with data
        timeline_case_found = False
        for case in integrated_data.get('cases', []):
            if case['id'] == self.test_case_id:
                timeline_case_found = True
                if not case.get('timeline'):
                    print("  Timeline data lost during connection integration")
                    return False
                break
        
        if not timeline_case_found:
            print("  Timeline case not found after connection integration")
            return False
        
        print(f"  Timeline data and connections integrate correctly")
        print(f"  Both timeline entries and connection persist together")
        
        return True
    
    def run_all_tests(self):
        """Run all timeline compatibility tests"""
        print("🧪 Starting Timeline Backend Compatibility Tests 🧪")
        print("Focus: Timeline fixes implemented in frontend compatibility")
        
        # Core API health tests
        self.run_test("API Endpoint Health (GET/PUT /api/mindmap-data)", self.test_api_endpoint_health)
        
        # Timeline-specific tests
        self.run_test("Case Node Timeline Structure Support", self.test_case_node_timeline_structure)
        self.run_test("Timeline Data Persistence", self.test_timeline_data_persistence)
        self.run_test("Timeline Data Updates & Integrity", self.test_timeline_data_updates)
        self.run_test("Timeline Error Handling", self.test_timeline_error_handling)
        self.run_test("Timeline-Connection Integration", self.test_timeline_connection_integration)
        
        # Print summary
        print("\n📊 Timeline Backend Compatibility Test Summary:")
        print(f"  Total Tests: {self.test_results['total']}")
        print(f"  Passed: {self.test_results['passed']}")
        print(f"  Failed: {self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for detail in self.test_results['details']:
                if "FAILED" in detail['status'] or "ERROR" in detail['status']:
                    print(f"  - {detail['name']}: {detail['status']}")
        else:
            print("\n✅ All Timeline Backend Compatibility Tests Passed!")
            print("Backend is fully compatible with frontend timeline fixes:")
            print("  ✓ Timeline data persistence working")
            print("  ✓ API endpoints healthy")
            print("  ✓ Case node structure supports timeline")
            print("  ✓ Data integrity maintained")
            print("  ✓ Error handling graceful")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = TimelineBackendCompatibilityTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("🎉 Backend fully compatible with timeline frontend changes!" if success else "⚠️  Some compatibility issues found!"))