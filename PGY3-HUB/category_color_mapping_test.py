import requests
import json
import uuid
from datetime import datetime

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://336d4c80-d84e-4815-a915-e2ffd980488a.preview.emergentagent.com/api"

class CategoryColorMappingTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.category_color_map = {
            "Mood Disorders": "#3B82F6",
            "Anxiety Disorders": "#059669", 
            "Psychotic Disorders": "#DC2626",
            "Personality Disorders": "#7C3AED",
            "Substance Use Disorders": "#EA580C",
            "Neurodevelopmental Disorders": "#0891B2",
            "Trauma and Stressor-Related Disorders": "#BE185D"
        }
        
    def test_category_color_mapping_functionality(self):
        """Test comprehensive category color mapping functionality"""
        print("🎨 Testing Category Color Mapping Functionality")
        
        # Get current data
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"❌ Failed to get current data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Create topics for each category
        test_topics = []
        for category, color in self.category_color_map.items():
            topic = {
                "id": str(uuid.uuid4()),
                "title": f"Test Topic - {category}",
                "description": f"Testing category color mapping for {category}",
                "category": category,
                "color": color,
                "position": {"x": 100, "y": 100},
                "flashcard_count": 10,
                "completed_flashcards": 5,
                "definition": f"Definition for {category}",
                "diagnostic_criteria": [f"Criterion 1 for {category}", f"Criterion 2 for {category}"],
                "comorbidities": ["Common comorbidity 1", "Common comorbidity 2"],
                "differential_diagnoses": ["Differential 1", "Differential 2"],
                "medications": [
                    {
                        "name": "Test Medication",
                        "dosage": "Test dosage",
                        "class": "Test class"
                    }
                ],
                "psychotherapy_modalities": [
                    {
                        "type": "Test Therapy",
                        "duration": "Test duration",
                        "effectiveness": "Test effectiveness"
                    }
                ],
                "last_updated": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            test_topics.append(topic)
        
        # Add all test topics to the data
        modified_data = data.copy()
        modified_data["topics"].extend(test_topics)
        
        # Save the data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"❌ Failed to save topics with category colors: {put_response.status_code}")
            return False
        
        # Verify all topics were saved with correct category-color mapping
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"❌ Failed to verify saved topics: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check each category-color mapping
        for test_topic in test_topics:
            found_topic = None
            for topic in verified_data["topics"]:
                if topic["id"] == test_topic["id"]:
                    found_topic = topic
                    break
            
            if not found_topic:
                print(f"❌ Topic for category '{test_topic['category']}' was not saved")
                return False
            
            if found_topic["category"] != test_topic["category"]:
                print(f"❌ Category mismatch for topic {test_topic['id']}")
                return False
            
            if found_topic["color"] != test_topic["color"]:
                print(f"❌ Color mismatch for category '{test_topic['category']}'. Expected: {test_topic['color']}, Got: {found_topic['color']}")
                return False
        
        print("✅ All category-color mappings preserved correctly")
        
        # Test category change with color update
        print("🔄 Testing category change with color update")
        
        # Change the first topic's category and color
        first_topic_id = test_topics[0]["id"]
        original_category = test_topics[0]["category"]
        new_category = "Anxiety Disorders"
        new_color = self.category_color_map[new_category]
        
        # Update the topic
        for topic in modified_data["topics"]:
            if topic["id"] == first_topic_id:
                topic["category"] = new_category
                topic["color"] = new_color
                topic["updated_at"] = datetime.utcnow().isoformat()
                topic["last_updated"] = datetime.utcnow().isoformat()
                break
        
        # Save the updated data
        put_response = requests.put(f"{self.base_url}/mindmap-data", json=modified_data)
        if put_response.status_code != 200:
            print(f"❌ Failed to save category change: {put_response.status_code}")
            return False
        
        # Verify the category change
        verify_response = requests.get(f"{self.base_url}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"❌ Failed to verify category change: {verify_response.status_code}")
            return False
        
        final_data = verify_response.json()
        
        # Check if the category and color were updated
        updated_topic = None
        for topic in final_data["topics"]:
            if topic["id"] == first_topic_id:
                updated_topic = topic
                break
        
        if not updated_topic:
            print(f"❌ Updated topic not found")
            return False
        
        if updated_topic["category"] != new_category:
            print(f"❌ Category was not updated. Expected: '{new_category}', Got: '{updated_topic['category']}'")
            return False
        
        if updated_topic["color"] != new_color:
            print(f"❌ Color was not updated. Expected: '{new_color}', Got: '{updated_topic['color']}'")
            return False
        
        print(f"✅ Successfully changed category from '{original_category}' to '{new_category}' with color update")
        print("✅ Category color mapping functionality is working correctly")
        
        return True

if __name__ == "__main__":
    tester = CategoryColorMappingTester(BASE_URL)
    success = tester.test_category_color_mapping_functionality()
    print("\n" + ("✅ Category color mapping tests passed!" if success else "❌ Category color mapping tests failed!"))