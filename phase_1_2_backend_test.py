import requests
import json
import uuid
from datetime import datetime
import time

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://494a8381-0596-45ab-a70d-c4430e97d812.preview.emergentagent.com/api"

class Phase12BackendTester:
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
    
    def test_api_endpoint_health_check(self):
        """Test all mind map API endpoints are working correctly"""
        print("  Testing API endpoint health...")
        
        # Test API root
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"    API root failed: {response.status_code}")
            return False
        print("    ✓ API root endpoint working")
        
        # Test GET /api/mindmap-data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"    GET mindmap-data failed: {response.status_code}")
            return False
        
        data = response.json()
        if not all(key in data for key in ["topics", "cases", "tasks", "literature", "connections"]):
            print(f"    GET mindmap-data missing keys: {data.keys()}")
            return False
        
        self.mindmap_data = data
        print("    ✓ GET /api/mindmap-data working")
        
        # Test PUT /api/mindmap-data
        test_data = data.copy()
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=test_data)
        if put_response.status_code != 200:
            print(f"    PUT mindmap-data failed: {put_response.status_code}")
            return False
        print("    ✓ PUT /api/mindmap-data working")
        
        # Test individual endpoints for compatibility
        endpoints = ["/topics", "/cases", "/tasks", "/literature"]
        for endpoint in endpoints:
            response = requests.get(f"{self.base_url}{endpoint}")
            if response.status_code != 200:
                print(f"    GET {endpoint} failed: {response.status_code}")
                return False
            print(f"    ✓ GET {endpoint} working")
        
        return True
    
    def test_node_component_data_compatibility(self):
        """Test that extracted node components can properly save/load data through backend"""
        print("  Testing node component data compatibility...")
        
        if not hasattr(self, 'mindmap_data'):
            print("    No mindmap data available")
            return False
        
        # Test creating new nodes of each type through extracted components
        test_nodes = {
            "topics": {
                "id": str(uuid.uuid4()),
                "title": "Test Psychiatric Topic",
                "description": "Test topic for node component compatibility",
                "category": "Test Category",
                "color": "#FF5733",
                "position": {"x": 100, "y": 200},
                "flashcard_count": 5,
                "completed_flashcards": 2,
                "resources": [{"title": "Test Resource", "url": "#", "type": "reference"}],
                "notes": "Test notes for topic",
                "tags": "test,compatibility",
                "definition": "Test definition",
                "diagnostic_criteria": ["Criterion 1", "Criterion 2"],
                "comorbidities": ["Comorbidity 1"],
                "differential_diagnoses": ["Differential 1"],
                "medications": [{"name": "Test Med", "dosage": "10mg"}],
                "psychotherapy_modalities": [{"name": "CBT", "description": "Test therapy"}],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            "cases": {
                "id": str(uuid.uuid4()),
                "case_id": "TEST-001",
                "encounter_date": datetime.utcnow().isoformat(),
                "primary_diagnosis": "Test Diagnosis",
                "secondary_diagnoses": ["Secondary Test"],
                "age": 30,
                "gender": "Test",
                "chief_complaint": "Test complaint",
                "initial_presentation": "Test initial presentation",
                "current_presentation": "Test current presentation",
                "medication_history": "Test medication history",
                "therapy_progress": "Test therapy progress",
                "defense_patterns": "Test defense patterns",
                "clinical_reflection": "Test clinical reflection",
                "history_present_illness": "Test HPI",
                "medical_history": "Test medical history",
                "medications": ["Test medication"],
                "mental_status_exam": "Test MSE",
                "assessment_plan": "Test assessment",
                "notes": "Test notes",
                "status": "active",
                "linked_topics": [],
                "position": {"x": 300, "y": 400},
                "timeline": [
                    {
                        "id": str(uuid.uuid4()),
                        "type": "Assessment",
                        "timestamp": datetime.utcnow().isoformat(),
                        "content": "Test timeline entry",
                        "author": "Test Author",
                        "metadata": {"test": "data"}
                    }
                ],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            "tasks": {
                "id": str(uuid.uuid4()),
                "title": "Test Task",
                "description": "Test task for compatibility",
                "status": "pending",
                "priority": "high",
                "due_date": datetime.utcnow().isoformat(),
                "linked_case_id": None,
                "linked_topic_id": None,
                "notes": "Test task notes",
                "position": {"x": 500, "y": 600},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            },
            "literature": {
                "id": str(uuid.uuid4()),
                "title": "Test Literature",
                "authors": "Test Author",
                "publication": "Test Journal",
                "year": 2024,
                "doi": "10.1000/test",
                "abstract": "Test abstract",
                "notes": "Test literature notes",
                "pdf_path": None,
                "linked_topics": [],
                "position": {"x": 700, "y": 800},
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
        }
        
        # Add test nodes to existing data
        modified_data = self.mindmap_data.copy()
        for node_type, node_data in test_nodes.items():
            modified_data[node_type].append(node_data)
        
        # Save the data with new nodes
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"    Failed to save test nodes: {put_response.status_code}")
            return False
        
        # Verify nodes were saved correctly
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"    Failed to verify saved nodes: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check each node type was saved correctly
        for node_type, test_node in test_nodes.items():
            found = False
            for node in verified_data[node_type]:
                if node["id"] == test_node["id"]:
                    # Verify key fields
                    if node_type == "topics" and node["title"] == test_node["title"]:
                        found = True
                    elif node_type == "cases" and node["case_id"] == test_node["case_id"]:
                        found = True
                    elif node_type == "tasks" and node["title"] == test_node["title"]:
                        found = True
                    elif node_type == "literature" and node["title"] == test_node["title"]:
                        found = True
                    break
            
            if not found:
                print(f"    Test {node_type} node not saved correctly")
                return False
            print(f"    ✓ {node_type} node component data compatibility verified")
        
        self.test_node_ids = {k: v["id"] for k, v in test_nodes.items()}
        self.mindmap_data = verified_data
        return True
    
    def test_timeline_data_persistence(self):
        """Test modular timeline functionality works with backend"""
        print("  Testing timeline data persistence...")
        
        if not hasattr(self, 'mindmap_data') or not hasattr(self, 'test_node_ids'):
            print("    No test data available")
            return False
        
        # Find our test case
        test_case_id = self.test_node_ids["cases"]
        test_case = None
        for case in self.mindmap_data["cases"]:
            if case["id"] == test_case_id:
                test_case = case
                break
        
        if not test_case:
            print("    Test case not found")
            return False
        
        # Test timeline entry creation
        new_timeline_entry = {
            "id": str(uuid.uuid4()),
            "type": "Medication",
            "timestamp": datetime.utcnow().isoformat(),
            "content": "Started new medication regimen",
            "author": "Dr. Test",
            "metadata": {
                "medication": "Test Drug",
                "dosage": "50mg",
                "frequency": "daily"
            }
        }
        
        # Add timeline entry to test case
        modified_data = self.mindmap_data.copy()
        for case in modified_data["cases"]:
            if case["id"] == test_case_id:
                case["timeline"].append(new_timeline_entry)
                break
        
        # Save updated data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"    Failed to save timeline entry: {put_response.status_code}")
            return False
        
        # Verify timeline entry was saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"    Failed to verify timeline entry: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check timeline entry exists
        timeline_found = False
        for case in verified_data["cases"]:
            if case["id"] == test_case_id:
                for entry in case["timeline"]:
                    if entry["id"] == new_timeline_entry["id"]:
                        if (entry["type"] == new_timeline_entry["type"] and
                            entry["content"] == new_timeline_entry["content"] and
                            entry["author"] == new_timeline_entry["author"]):
                            timeline_found = True
                            break
                break
        
        if not timeline_found:
            print("    Timeline entry not saved correctly")
            return False
        
        print("    ✓ Timeline entry creation and persistence verified")
        
        # Test timeline entry update
        for case in verified_data["cases"]:
            if case["id"] == test_case_id:
                for entry in case["timeline"]:
                    if entry["id"] == new_timeline_entry["id"]:
                        entry["content"] = "Updated medication regimen"
                        break
                break
        
        # Save updated timeline
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=verified_data)
        if put_response.status_code != 200:
            print("    Failed to save updated timeline entry")
            return False
        
        # Verify update
        final_response = requests.get(f"{self.base_url}/mindmap-data")
        final_data = final_response.json()
        
        update_found = False
        for case in final_data["cases"]:
            if case["id"] == test_case_id:
                for entry in case["timeline"]:
                    if entry["id"] == new_timeline_entry["id"]:
                        if entry["content"] == "Updated medication regimen":
                            update_found = True
                            break
                break
        
        if not update_found:
            print("    Timeline entry update not saved correctly")
            return False
        
        print("    ✓ Timeline entry update and persistence verified")
        
        self.mindmap_data = final_data
        return True
    
    def test_connection_system_integrity(self):
        """Test multi-directional connection handles work with backend persistence"""
        print("  Testing connection system integrity...")
        
        if not hasattr(self, 'mindmap_data') or not hasattr(self, 'test_node_ids'):
            print("    No test data available")
            return False
        
        # Test multi-directional connections between different node types
        test_connections = [
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.test_node_ids["topics"],
                "target": self.test_node_ids["cases"],
                "sourceHandle": "bottom",
                "targetHandle": "top",
                "label": "Topic-Case Connection",
                "style": {"stroke": "#3B82F6", "strokeWidth": 2}
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.test_node_ids["cases"],
                "target": self.test_node_ids["tasks"],
                "sourceHandle": "right",
                "targetHandle": "left",
                "label": "Case-Task Connection",
                "style": {"stroke": "#059669", "strokeWidth": 2}
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.test_node_ids["literature"],
                "target": self.test_node_ids["topics"],
                "sourceHandle": "top",
                "targetHandle": "bottom",
                "label": "Literature-Topic Connection",
                "style": {"stroke": "#DC2626", "strokeWidth": 2}
            },
            {
                "id": f"e{uuid.uuid4().hex}",
                "source": self.test_node_ids["tasks"],
                "target": self.test_node_ids["literature"],
                "sourceHandle": "left",
                "targetHandle": "right",
                "label": "Task-Literature Connection",
                "style": {"stroke": "#7C3AED", "strokeWidth": 2}
            }
        ]
        
        # Add connections to data
        modified_data = self.mindmap_data.copy()
        for connection in test_connections:
            modified_data["connections"].append(connection)
        
        # Save connections
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"    Failed to save connections: {put_response.status_code}")
            return False
        
        # Verify connections were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"    Failed to verify connections: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check all connections exist with correct handles
        connection_ids = [conn["id"] for conn in test_connections]
        found_connections = 0
        
        for connection in verified_data["connections"]:
            if connection["id"] in connection_ids:
                # Verify handle directions are preserved
                original_conn = next(c for c in test_connections if c["id"] == connection["id"])
                if (connection["sourceHandle"] == original_conn["sourceHandle"] and
                    connection["targetHandle"] == original_conn["targetHandle"] and
                    connection["label"] == original_conn["label"]):
                    found_connections += 1
        
        if found_connections != len(test_connections):
            print(f"    Not all connections saved correctly. Found {found_connections} of {len(test_connections)}")
            return False
        
        print(f"    ✓ All {found_connections} multi-directional connections saved correctly")
        
        # Test connection deletion
        modified_data = verified_data.copy()
        modified_data["connections"] = [conn for conn in modified_data["connections"] 
                                      if conn["id"] != test_connections[0]["id"]]
        
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print("    Failed to delete connection")
            return False
        
        # Verify deletion
        final_response = requests.get(f"{self.base_url}/mindmap-data")
        final_data = final_response.json()
        
        deleted_found = False
        for connection in final_data["connections"]:
            if connection["id"] == test_connections[0]["id"]:
                deleted_found = True
                break
        
        if deleted_found:
            print("    Connection deletion failed")
            return False
        
        print("    ✓ Connection deletion verified")
        
        self.mindmap_data = final_data
        self.test_connection_ids = [conn["id"] for conn in test_connections[1:]]
        return True
    
    def test_modal_system_data_flow(self):
        """Test that modal operations work correctly with new architecture"""
        print("  Testing modal system data flow...")
        
        if not hasattr(self, 'mindmap_data') or not hasattr(self, 'test_node_ids'):
            print("    No test data available")
            return False
        
        # Test CRUD operations that would be performed through modals
        
        # CREATE: Add new node through modal-like operation
        new_topic = {
            "id": str(uuid.uuid4()),
            "title": "Modal Created Topic",
            "description": "Created through modal system test",
            "category": "Modal Test",
            "color": "#8B5CF6",
            "position": {"x": 900, "y": 1000},
            "flashcard_count": 0,
            "completed_flashcards": 0,
            "resources": [],
            "notes": "Modal test notes",
            "tags": "modal,test",
            "definition": "Modal test definition",
            "diagnostic_criteria": [],
            "comorbidities": [],
            "differential_diagnoses": [],
            "medications": [],
            "psychotherapy_modalities": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        modified_data = self.mindmap_data.copy()
        modified_data["topics"].append(new_topic)
        
        # Save new topic
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"    Failed to create topic through modal: {put_response.status_code}")
            return False
        
        print("    ✓ Modal CREATE operation verified")
        
        # READ: Verify data can be retrieved for modal display
        read_response = requests.get(f"{self.base_url}/mindmap-data")
        if read_response.status_code != 200:
            print("    Failed to read data for modal")
            return False
        
        read_data = read_response.json()
        topic_found = False
        for topic in read_data["topics"]:
            if topic["id"] == new_topic["id"]:
                topic_found = True
                break
        
        if not topic_found:
            print("    Modal READ operation failed")
            return False
        
        print("    ✓ Modal READ operation verified")
        
        # UPDATE: Modify existing node through modal-like operation
        for topic in read_data["topics"]:
            if topic["id"] == new_topic["id"]:
                topic["title"] = "Updated Modal Topic"
                topic["description"] = "Updated through modal system"
                topic["updated_at"] = datetime.utcnow().isoformat()
                break
        
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=read_data)
        if put_response.status_code != 200:
            print("    Failed to update topic through modal")
            return False
        
        # Verify update
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        verify_data = verify_response.json()
        
        update_found = False
        for topic in verify_data["topics"]:
            if topic["id"] == new_topic["id"]:
                if topic["title"] == "Updated Modal Topic":
                    update_found = True
                break
        
        if not update_found:
            print("    Modal UPDATE operation failed")
            return False
        
        print("    ✓ Modal UPDATE operation verified")
        
        # DELETE: Remove node through modal-like operation
        verify_data["topics"] = [topic for topic in verify_data["topics"] 
                                if topic["id"] != new_topic["id"]]
        
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=verify_data)
        if put_response.status_code != 200:
            print("    Failed to delete topic through modal")
            return False
        
        # Verify deletion
        final_response = requests.get(f"{self.base_url}/mindmap-data")
        final_data = final_response.json()
        
        delete_found = False
        for topic in final_data["topics"]:
            if topic["id"] == new_topic["id"]:
                delete_found = True
                break
        
        if delete_found:
            print("    Modal DELETE operation failed")
            return False
        
        print("    ✓ Modal DELETE operation verified")
        
        self.mindmap_data = final_data
        return True
    
    def test_performance_and_error_handling(self):
        """Test backend performance and error handling with modular frontend"""
        print("  Testing performance and error handling...")
        
        # Test rapid successive requests (simulating modular components making concurrent calls)
        start_time = time.time()
        responses = []
        
        for i in range(5):
            response = requests.get(f"{self.base_url}/mindmap-data")
            responses.append(response)
            time.sleep(0.1)  # Small delay between requests
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Check all requests succeeded
        for i, response in enumerate(responses):
            if response.status_code != 200:
                print(f"    Request {i+1} failed: {response.status_code}")
                return False
        
        print(f"    ✓ 5 rapid requests completed in {total_time:.2f}s")
        
        # Test error handling with invalid data
        invalid_data = {
            "topics": "invalid_structure",  # Should be array
            "cases": [],
            "tasks": [],
            "literature": [],
            "connections": []
        }
        
        error_response = requests.put(f"{self.base_url}/mindmap-data", json=invalid_data)
        
        # Server should handle this gracefully (either reject or accept with validation)
        if error_response.status_code >= 500:
            print(f"    Server error with invalid data: {error_response.status_code}")
            return False
        
        print("    ✓ Error handling for invalid data verified")
        
        # Test large data handling (simulating complex mind map)
        if hasattr(self, 'mindmap_data'):
            large_data = self.mindmap_data.copy()
            
            # Add many test nodes
            for i in range(20):
                large_data["topics"].append({
                    "id": str(uuid.uuid4()),
                    "title": f"Performance Test Topic {i}",
                    "description": f"Topic {i} for performance testing",
                    "category": "Performance Test",
                    "color": "#10B981",
                    "position": {"x": i * 50, "y": i * 50},
                    "flashcard_count": i,
                    "completed_flashcards": i // 2,
                    "resources": [],
                    "notes": f"Performance test notes {i}",
                    "tags": f"performance,test,{i}",
                    "definition": f"Performance test definition {i}",
                    "diagnostic_criteria": [f"Criterion {i}"],
                    "comorbidities": [],
                    "differential_diagnoses": [],
                    "medications": [],
                    "psychotherapy_modalities": [],
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })
            
            start_time = time.time()
            large_response = requests.put(f"{self.base_url}/mindmap-data", json=large_data)
            end_time = time.time()
            
            if large_response.status_code != 200:
                print(f"    Large data handling failed: {large_response.status_code}")
                return False
            
            save_time = end_time - start_time
            print(f"    ✓ Large data (20 additional nodes) saved in {save_time:.2f}s")
        
        return True
    
    def run_all_tests(self):
        """Run all Phase 1 & 2 backend compatibility tests"""
        print("🧪 Starting Phase 1 & 2 Frontend Architecture Backend Compatibility Tests 🧪")
        print("Testing backend API functionality after frontend modular optimizations...")
        
        # Run tests in order of dependencies
        self.run_test("API Endpoint Health Check", self.test_api_endpoint_health_check)
        self.run_test("Node Component Data Compatibility", self.test_node_component_data_compatibility)
        self.run_test("Timeline Data Persistence", self.test_timeline_data_persistence)
        self.run_test("Connection System Integrity", self.test_connection_system_integrity)
        self.run_test("Modal System Data Flow", self.test_modal_system_data_flow)
        self.run_test("Performance & Error Handling", self.test_performance_and_error_handling)
        
        # Print summary
        print("\n📊 Phase 1 & 2 Backend Compatibility Test Summary:")
        print(f"  Total Tests: {self.test_results['total']}")
        print(f"  Passed: {self.test_results['passed']}")
        print(f"  Failed: {self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for detail in self.test_results['details']:
                if "FAILED" in detail['status'] or "ERROR" in detail['status']:
                    print(f"  - {detail['name']}: {detail['status']}")
        else:
            print("\n✅ All backend functionality works correctly with modular frontend architecture!")
            print("The backend transparently supports the new modular frontend structure.")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = Phase12BackendTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ Backend is fully compatible with Phase 1 & 2 optimizations!" if success else "❌ Some backend compatibility issues found!"))