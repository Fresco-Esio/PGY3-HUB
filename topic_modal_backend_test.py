import requests
import json
import uuid
from datetime import datetime
import time

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://39409560-62b0-4839-a8c9-4bc285999ef7.preview.emergentagent.com/api"

class TopicModalBackendTester:
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
    
    def test_api_connectivity(self):
        """Test basic API connectivity"""
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data:
            print(f"  Expected message about API running, got {data}")
            return False
            
        print(f"  API connectivity confirmed: {data['message']}")
        return True
    
    def test_get_current_mindmap_data(self):
        """Test getting current mindmap data structure"""
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
        
        # Print current topic structure
        if data["topics"]:
            sample_topic = data["topics"][0]
            print(f"  Current topic fields: {list(sample_topic.keys())}")
            print(f"  Found {len(data['topics'])} topics")
        else:
            print("  No topics found in current data")
        
        return True
    
    def test_topic_model_validation_current_fields(self):
        """Test current topic model fields are properly handled"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available for testing")
            return False
        
        # Create a topic with current model fields
        new_topic = {
            "id": str(uuid.uuid4()),
            "title": "Test Topic - Current Model",
            "description": "Testing current topic model fields",
            "category": "Test Category",
            "color": "#FF5733",
            "position": {"x": 100, "y": 200},
            "flashcard_count": 15,
            "completed_flashcards": 8,
            "resources": [
                {"title": "Test Resource", "url": "https://example.com", "type": "reference"}
            ],
            "notes": "Test notes for current model",
            "tags": "test,current,model",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add the topic to mindmap data
        modified_data = self.mindmap_data.copy()
        modified_data["topics"].append(new_topic)
        
        # Save the data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save topic with current model fields: {put_response.status_code}")
            return False
        
        # Verify the topic was saved correctly
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved topic: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Find our topic
        found_topic = None
        for topic in verified_data["topics"]:
            if topic["id"] == new_topic["id"]:
                found_topic = topic
                break
        
        if not found_topic:
            print("  Topic with current model fields was not saved")
            return False
        
        # Verify all fields were preserved
        for key, value in new_topic.items():
            if key not in found_topic:
                print(f"  Missing field '{key}' in saved topic")
                return False
            if found_topic[key] != value:
                print(f"  Field '{key}' value mismatch. Expected: {value}, Got: {found_topic[key]}")
                return False
        
        print("  Current topic model fields are properly handled")
        self.test_topic_id = new_topic["id"]
        self.mindmap_data = verified_data
        return True
    
    def test_topic_model_validation_new_fields(self):
        """Test new topic model fields required for redesigned tabbed interface"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available for testing")
            return False
        
        # Create a topic with NEW fields required for tabbed interface
        new_topic_with_extended_fields = {
            "id": str(uuid.uuid4()),
            "title": "Test Topic - Extended Model",
            "description": "Testing extended topic model fields",
            "category": "Mood Disorders",
            "color": "#3B82F6",
            "position": {"x": 300, "y": 400},
            "flashcard_count": 25,
            "completed_flashcards": 12,
            "resources": [
                {"title": "DSM-5 Criteria", "url": "https://example.com", "type": "reference"}
            ],
            "notes": "Test notes for extended model",
            "tags": "test,extended,model",
            # NEW FIELDS for redesigned tabbed interface
            "definition": "A comprehensive definition of the psychiatric condition",
            "diagnostic_criteria": [
                "Criterion A: Persistent depressed mood",
                "Criterion B: Diminished interest or pleasure",
                "Criterion C: Significant weight loss or gain"
            ],
            "comorbidities": [
                "Generalized Anxiety Disorder",
                "Substance Use Disorder",
                "Personality Disorders"
            ],
            "differential_diagnoses": [
                "Bipolar Disorder",
                "Adjustment Disorder",
                "Medical conditions causing depression"
            ],
            "medications": [
                {
                    "name": "Sertraline",
                    "dosage": "50-200mg daily",
                    "class": "SSRI",
                    "notes": "First-line treatment"
                },
                {
                    "name": "Bupropion",
                    "dosage": "150-300mg daily",
                    "class": "NDRI",
                    "notes": "Good for energy and motivation"
                }
            ],
            "psychotherapy_modalities": [
                {
                    "type": "Cognitive Behavioral Therapy",
                    "duration": "12-16 sessions",
                    "effectiveness": "High evidence base"
                },
                {
                    "type": "Interpersonal Therapy",
                    "duration": "12-16 sessions",
                    "effectiveness": "Moderate evidence base"
                }
            ],
            "last_updated": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add the topic to mindmap data
        modified_data = self.mindmap_data.copy()
        modified_data["topics"].append(new_topic_with_extended_fields)
        
        # Save the data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save topic with extended fields: {put_response.status_code}")
            print(f"  Response: {put_response.text}")
            return False
        
        # Verify the topic was saved correctly
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify saved extended topic: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Find our topic
        found_topic = None
        for topic in verified_data["topics"]:
            if topic["id"] == new_topic_with_extended_fields["id"]:
                found_topic = topic
                break
        
        if not found_topic:
            print("  Topic with extended fields was not saved")
            return False
        
        # Verify all fields were preserved, especially arrays and complex objects
        critical_fields = ["diagnostic_criteria", "comorbidities", "differential_diagnoses", "medications", "psychotherapy_modalities"]
        
        for field in critical_fields:
            if field not in found_topic:
                print(f"  Missing critical field '{field}' in saved topic")
                return False
            
            original_value = new_topic_with_extended_fields[field]
            saved_value = found_topic[field]
            
            # Check if arrays are preserved as arrays (not converted to strings)
            if isinstance(original_value, list):
                if not isinstance(saved_value, list):
                    print(f"  Field '{field}' was not preserved as array. Got type: {type(saved_value)}")
                    return False
                
                if len(original_value) != len(saved_value):
                    print(f"  Field '{field}' array length mismatch. Expected: {len(original_value)}, Got: {len(saved_value)}")
                    return False
        
        print("  Extended topic model fields are properly handled")
        print(f"  Successfully preserved arrays: {critical_fields}")
        self.extended_topic_id = new_topic_with_extended_fields["id"]
        self.mindmap_data = verified_data
        return True
    
    def test_data_type_preservation(self):
        """Test that different data types are properly preserved"""
        if not hasattr(self, 'extended_topic_id'):
            print("  No extended topic available for testing")
            return False
        
        # Get the current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get current data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Find our extended topic
        found_topic = None
        for topic in data["topics"]:
            if topic["id"] == self.extended_topic_id:
                found_topic = topic
                break
        
        if not found_topic:
            print("  Extended topic not found")
            return False
        
        # Test data type preservation
        type_tests = [
            ("flashcard_count", int, "integer"),
            ("completed_flashcards", int, "integer"),
            ("diagnostic_criteria", list, "array"),
            ("comorbidities", list, "array"),
            ("differential_diagnoses", list, "array"),
            ("medications", list, "array"),
            ("psychotherapy_modalities", list, "array"),
            ("position", dict, "object")
        ]
        
        for field_name, expected_type, type_description in type_tests:
            if field_name in found_topic:
                actual_value = found_topic[field_name]
                if not isinstance(actual_value, expected_type):
                    print(f"  Field '{field_name}' type mismatch. Expected {type_description}, got {type(actual_value)}")
                    return False
        
        print("  All data types properly preserved")
        return True
    
    def test_category_change_persistence(self):
        """Test that category changes are properly persisted"""
        if not hasattr(self, 'test_topic_id'):
            print("  No test topic available for testing")
            return False
        
        # Get current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get current data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Find our test topic and change its category
        modified_data = data.copy()
        topic_found = False
        
        for topic in modified_data["topics"]:
            if topic["id"] == self.test_topic_id:
                original_category = topic["category"]
                topic["category"] = "Anxiety Disorders"  # Change category
                topic["color"] = "#059669"  # Change color to match new category
                topic["updated_at"] = datetime.utcnow().isoformat()
                topic_found = True
                break
        
        if not topic_found:
            print("  Test topic not found for category change")
            return False
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save category change: {put_response.status_code}")
            return False
        
        # Verify the changes were saved
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify category change: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if the category and color were updated
        for topic in verified_data["topics"]:
            if topic["id"] == self.test_topic_id:
                if topic["category"] != "Anxiety Disorders":
                    print(f"  Category was not updated. Expected: 'Anxiety Disorders', Got: '{topic['category']}'")
                    return False
                if topic["color"] != "#059669":
                    print(f"  Color was not updated. Expected: '#059669', Got: '{topic['color']}'")
                    return False
                break
        
        print("  Category change and color mapping properly persisted")
        self.mindmap_data = verified_data
        return True
    
    def test_complex_nested_data_serialization(self):
        """Test serialization/deserialization of complex nested data structures"""
        if not hasattr(self, 'mindmap_data'):
            print("  No mindmap data available for testing")
            return False
        
        # Create a topic with very complex nested structures
        complex_topic = {
            "id": str(uuid.uuid4()),
            "title": "Complex Nested Data Test",
            "description": "Testing complex nested data structures",
            "category": "Test Category",
            "color": "#FF6B6B",
            "position": {"x": 500, "y": 600},
            "flashcard_count": 30,
            "completed_flashcards": 20,
            "medications": [
                {
                    "name": "Complex Medication",
                    "dosage": "Variable",
                    "class": "Test Class",
                    "side_effects": ["Nausea", "Dizziness", "Headache"],
                    "contraindications": {
                        "absolute": ["Pregnancy", "Liver disease"],
                        "relative": ["Kidney disease", "Heart conditions"]
                    },
                    "monitoring": {
                        "frequency": "Weekly",
                        "parameters": ["Liver function", "Blood count"],
                        "duration": "First 3 months"
                    }
                }
            ],
            "psychotherapy_modalities": [
                {
                    "type": "Complex Therapy",
                    "phases": [
                        {
                            "name": "Assessment Phase",
                            "duration": "2-3 sessions",
                            "goals": ["Establish rapport", "Assess symptoms"]
                        },
                        {
                            "name": "Treatment Phase",
                            "duration": "8-12 sessions",
                            "goals": ["Address core issues", "Develop coping skills"]
                        }
                    ],
                    "techniques": {
                        "cognitive": ["Thought challenging", "Behavioral experiments"],
                        "behavioral": ["Exposure therapy", "Activity scheduling"]
                    }
                }
            ],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add the complex topic to mindmap data
        modified_data = self.mindmap_data.copy()
        modified_data["topics"].append(complex_topic)
        
        # Save the data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save complex nested data: {put_response.status_code}")
            return False
        
        # Verify the complex data was saved correctly
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify complex nested data: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Find our complex topic
        found_topic = None
        for topic in verified_data["topics"]:
            if topic["id"] == complex_topic["id"]:
                found_topic = topic
                break
        
        if not found_topic:
            print("  Complex nested topic was not saved")
            return False
        
        # Verify complex nested structures
        if "medications" in found_topic and found_topic["medications"]:
            medication = found_topic["medications"][0]
            if "contraindications" not in medication:
                print("  Complex nested contraindications object was not preserved")
                return False
            
            contraindications = medication["contraindications"]
            if not isinstance(contraindications, dict):
                print(f"  Contraindications should be object, got {type(contraindications)}")
                return False
            
            if "absolute" not in contraindications or not isinstance(contraindications["absolute"], list):
                print("  Nested array within object was not preserved correctly")
                return False
        
        print("  Complex nested data structures properly serialized/deserialized")
        self.complex_topic_id = complex_topic["id"]
        self.mindmap_data = verified_data
        return True
    
    def test_timestamp_updates(self):
        """Test that timestamp updates work correctly"""
        if not hasattr(self, 'complex_topic_id'):
            print("  No complex topic available for testing")
            return False
        
        # Get current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get current data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Find our complex topic and update it
        modified_data = data.copy()
        original_updated_at = None
        
        for topic in modified_data["topics"]:
            if topic["id"] == self.complex_topic_id:
                original_updated_at = topic.get("updated_at")
                # Make a small change and update timestamp
                topic["description"] = "Updated description for timestamp test"
                topic["updated_at"] = datetime.utcnow().isoformat()
                topic["last_updated"] = datetime.utcnow().isoformat()
                break
        
        if not original_updated_at:
            print("  Could not find original timestamp")
            return False
        
        # Wait a moment to ensure timestamp difference
        time.sleep(1)
        
        # Save the modified data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"  Failed to save timestamp update: {put_response.status_code}")
            return False
        
        # Verify the timestamp was updated
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify timestamp update: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if the timestamp was updated
        for topic in verified_data["topics"]:
            if topic["id"] == self.complex_topic_id:
                new_updated_at = topic.get("updated_at")
                if new_updated_at == original_updated_at:
                    print("  Timestamp was not updated")
                    return False
                
                # Check if last_updated field exists
                if "last_updated" not in topic:
                    print("  last_updated field was not preserved")
                    return False
                
                break
        
        print("  Timestamp updates work correctly")
        return True
    
    def test_api_error_handling(self):
        """Test API error handling for invalid data"""
        # Test with completely invalid JSON structure
        invalid_data = {
            "invalid_structure": "This is not a valid mindmap data structure"
        }
        
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=invalid_data)
        
        # The API should either reject this or handle it gracefully
        if put_response.status_code >= 400:
            print("  API correctly rejects invalid data structure")
            return True
        else:
            # If it accepts it, verify the system remains stable
            verify_response = requests.get(f"{self.base_url}/mindmap-data")
            if verify_response.status_code == 200:
                print("  API handles invalid data gracefully")
                return True
            else:
                print("  API became unstable after invalid data")
                return False
    
    def run_all_tests(self):
        """Run all TopicModal backend integration tests"""
        print("🧪 Starting TopicModal Backend Integration Tests 🧪")
        print("Testing redesigned tabbed interface data structure support")
        
        # Basic connectivity tests
        self.run_test("API Connectivity", self.test_api_connectivity)
        self.run_test("Get Current MindMap Data", self.test_get_current_mindmap_data)
        
        # Topic model validation tests
        self.run_test("Current Topic Model Fields", self.test_topic_model_validation_current_fields)
        self.run_test("New Topic Model Fields (Tabbed Interface)", self.test_topic_model_validation_new_fields)
        
        # Data integrity tests
        self.run_test("Data Type Preservation", self.test_data_type_preservation)
        self.run_test("Category Change Persistence", self.test_category_change_persistence)
        self.run_test("Complex Nested Data Serialization", self.test_complex_nested_data_serialization)
        self.run_test("Timestamp Updates", self.test_timestamp_updates)
        
        # Error handling tests
        self.run_test("API Error Handling", self.test_api_error_handling)
        
        # Print summary
        print("\n📊 TopicModal Backend Integration Test Summary:")
        print(f"  Total Tests: {self.test_results['total']}")
        print(f"  Passed: {self.test_results['passed']}")
        print(f"  Failed: {self.test_results['failed']}")
        
        if self.test_results['failed'] > 0:
            print("\n❌ Failed Tests:")
            for detail in self.test_results['details']:
                if "FAILED" in detail['status'] or "ERROR" in detail['status']:
                    print(f"  - {detail['name']}: {detail['status']}")
        else:
            print("\n✅ All TopicModal backend integration tests passed!")
            print("The backend can handle the redesigned tabbed interface data structure.")
        
        return self.test_results['failed'] == 0

if __name__ == "__main__":
    tester = TopicModalBackendTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ TopicModal backend integration is ready!" if success else "❌ TopicModal backend integration needs attention!"))