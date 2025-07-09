import requests
import json
import uuid
from datetime import datetime
import os
import time

# Use localhost for testing the local JSON implementation
BASE_URL = "http://localhost:8001/api"

def test_get_mindmap_data():
    """Test the GET /api/mindmap-data endpoint"""
    print("\n🔍 Testing GET /api/mindmap-data endpoint")
    
    response = requests.get(f"{BASE_URL}/mindmap-data")
    if response.status_code != 200:
        print(f"❌ FAILED: Expected status code 200, got {response.status_code}")
        return False
    
    data = response.json()
    
    # Check that the response has the expected structure
    required_keys = ["topics", "cases", "tasks", "literature", "connections"]
    for key in required_keys:
        if key not in data:
            print(f"❌ FAILED: Missing required key '{key}' in response")
            return False
    
    # Print some details about the data
    print(f"✅ Response contains all required keys: {', '.join(required_keys)}")
    print(f"✅ Found {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature items, {len(data['connections'])} connections")
    
    # Check data types
    if not isinstance(data["topics"], list):
        print(f"❌ FAILED: 'topics' is not a list")
        return False
    
    if not isinstance(data["cases"], list):
        print(f"❌ FAILED: 'cases' is not a list")
        return False
    
    if not isinstance(data["tasks"], list):
        print(f"❌ FAILED: 'tasks' is not a list")
        return False
    
    if not isinstance(data["literature"], list):
        print(f"❌ FAILED: 'literature' is not a list")
        return False
    
    if not isinstance(data["connections"], list):
        print(f"❌ FAILED: 'connections' is not a list")
        return False
    
    print(f"✅ All data structures have correct types")
    
    # Check if topics have the required fields
    if data["topics"]:
        topic = data["topics"][0]
        required_topic_fields = ["id", "title", "category", "color", "position", "flashcard_count", "completed_flashcards"]
        for field in required_topic_fields:
            if field not in topic:
                print(f"❌ FAILED: Topic missing required field '{field}'")
                return False
        print(f"✅ Topics have all required fields: {', '.join(required_topic_fields)}")
    
    # Check if cases have the required fields
    if data["cases"]:
        case = data["cases"][0]
        required_case_fields = ["id", "case_id", "primary_diagnosis", "position"]
        for field in required_case_fields:
            if field not in case:
                print(f"❌ FAILED: Case missing required field '{field}'")
                return False
        print(f"✅ Cases have all required fields: {', '.join(required_case_fields)}")
    
    # Check if tasks have the required fields
    if data["tasks"]:
        task = data["tasks"][0]
        required_task_fields = ["id", "title", "priority", "status", "position"]
        for field in required_task_fields:
            if field not in task:
                print(f"❌ FAILED: Task missing required field '{field}'")
                return False
        print(f"✅ Tasks have all required fields: {', '.join(required_task_fields)}")
    
    # Check if literature items have the required fields
    if data["literature"]:
        lit = data["literature"][0]
        required_lit_fields = ["id", "title", "position"]
        for field in required_lit_fields:
            if field not in lit:
                print(f"❌ FAILED: Literature missing required field '{field}'")
                return False
        print(f"✅ Literature items have all required fields: {', '.join(required_lit_fields)}")
    
    # Check if connections have the required fields
    if data["connections"]:
        connection = data["connections"][0]
        required_connection_fields = ["id", "source", "target"]
        for field in required_connection_fields:
            if field not in connection:
                print(f"❌ FAILED: Connection missing required field '{field}'")
                return False
        print(f"✅ Connections have all required fields: {', '.join(required_connection_fields)}")
        
        # Check if connections have sourceHandle and targetHandle
        if "sourceHandle" in connection and "targetHandle" in connection:
            print(f"✅ Connections include sourceHandle and targetHandle properties")
        else:
            print(f"⚠️ Note: Connections do not include sourceHandle and targetHandle properties")
    
    print(f"✅ GET /api/mindmap-data endpoint works correctly")
    return True

def test_put_mindmap_data():
    """Test the PUT /api/mindmap-data endpoint"""
    print("\n🔍 Testing PUT /api/mindmap-data endpoint")
    
    # First, get the current data
    get_response = requests.get(f"{BASE_URL}/mindmap-data")
    if get_response.status_code != 200:
        print(f"❌ FAILED: Could not get current data, status code {get_response.status_code}")
        return False
    
    current_data = get_response.json()
    
    # Make a copy of the data to modify
    modified_data = current_data.copy()
    
    # Add a new topic with a unique ID and title
    test_id = str(uuid.uuid4())
    test_title = f"Test Topic {uuid.uuid4().hex[:6]}"
    
    new_topic = {
        "id": test_id,
        "title": test_title,
        "description": "A test topic created for PUT endpoint testing",
        "category": "Test Category",
        "color": "#FF5733",
        "position": {"x": 500, "y": 300},
        "flashcard_count": 5,
        "completed_flashcards": 2,
        "resources": [],
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
    
    modified_data["topics"].append(new_topic)
    
    # Save the modified data
    put_response = requests.put(f"{BASE_URL}/mindmap-data", json=modified_data)
    if put_response.status_code != 200:
        print(f"❌ FAILED: PUT request failed with status code {put_response.status_code}")
        return False
    
    print(f"✅ PUT request succeeded with status code {put_response.status_code}")
    
    # Verify the data was saved by getting it again
    verify_response = requests.get(f"{BASE_URL}/mindmap-data")
    if verify_response.status_code != 200:
        print(f"❌ FAILED: Could not verify saved data, status code {verify_response.status_code}")
        return False
    
    verified_data = verify_response.json()
    
    # Check if our new topic is in the data
    found_topic = False
    for topic in verified_data["topics"]:
        if topic["id"] == test_id:
            found_topic = True
            if topic["title"] != test_title:
                print(f"❌ FAILED: Topic title was not saved correctly. Expected '{test_title}', got '{topic['title']}'")
                return False
            break
    
    if not found_topic:
        print(f"❌ FAILED: New topic was not found in the saved data")
        return False
    
    print(f"✅ New topic was saved correctly and retrieved with the correct data")
    
    # Test updating an existing topic
    for topic in verified_data["topics"]:
        if topic["id"] == test_id:
            topic["description"] = "Updated description for PUT test"
            break
    
    update_response = requests.put(f"{BASE_URL}/mindmap-data", json=verified_data)
    if update_response.status_code != 200:
        print(f"❌ FAILED: Update request failed with status code {update_response.status_code}")
        return False
    
    print(f"✅ Update request succeeded with status code {update_response.status_code}")
    
    # Verify the update was saved
    final_response = requests.get(f"{BASE_URL}/mindmap-data")
    if final_response.status_code != 200:
        print(f"❌ FAILED: Could not verify updated data, status code {final_response.status_code}")
        return False
    
    final_data = final_response.json()
    
    # Check if our topic was updated
    found_updated = False
    for topic in final_data["topics"]:
        if topic["id"] == test_id:
            found_updated = True
            if topic["description"] != "Updated description for PUT test":
                print(f"❌ FAILED: Topic description was not updated correctly. Expected 'Updated description for PUT test', got '{topic['description']}'")
                return False
            break
    
    if not found_updated:
        print(f"❌ FAILED: Updated topic was not found in the final data")
        return False
    
    print(f"✅ Topic was updated correctly and retrieved with the updated data")
    print(f"✅ PUT /api/mindmap-data endpoint works correctly for both creating and updating data")
    return True

def test_connections_handling():
    """Test that connections with sourceHandle and targetHandle are properly handled"""
    print("\n🔍 Testing connections handling with sourceHandle and targetHandle")
    
    # First, get the current data
    get_response = requests.get(f"{BASE_URL}/mindmap-data")
    if get_response.status_code != 200:
        print(f"❌ FAILED: Could not get current data, status code {get_response.status_code}")
        return False
    
    current_data = get_response.json()
    
    # Make a copy of the data to modify
    modified_data = current_data.copy()
    
    # Ensure we have at least one topic and one case
    if not modified_data["topics"] or not modified_data["cases"]:
        print("❌ FAILED: Not enough data to test connections")
        return False
    
    topic_id = modified_data["topics"][0]["id"]
    case_id = modified_data["cases"][0]["id"]
    
    # Create a new connection with sourceHandle and targetHandle
    connection_id = f"e{uuid.uuid4().hex}"
    new_connection = {
        "id": connection_id,
        "source": topic_id,
        "target": case_id,
        "sourceHandle": "bottom",
        "targetHandle": "top",
        "label": "Test Connection Label"
    }
    
    # Add the connection to the data
    if "connections" not in modified_data:
        modified_data["connections"] = []
    
    modified_data["connections"].append(new_connection)
    
    # Save the modified data
    put_response = requests.put(f"{BASE_URL}/mindmap-data", json=modified_data)
    if put_response.status_code != 200:
        print(f"❌ FAILED: Could not save connection, status code {put_response.status_code}")
        return False
    
    print(f"✅ Connection saved successfully")
    
    # Verify the connection was saved
    verify_response = requests.get(f"{BASE_URL}/mindmap-data")
    if verify_response.status_code != 200:
        print(f"❌ FAILED: Could not verify saved connection, status code {verify_response.status_code}")
        return False
    
    verified_data = verify_response.json()
    
    # Check if our new connection is in the data
    found_connection = False
    for connection in verified_data["connections"]:
        if connection["id"] == connection_id:
            found_connection = True
            
            # Verify all properties were saved correctly
            if connection["source"] != topic_id:
                print(f"❌ FAILED: Connection source was not saved correctly. Expected '{topic_id}', got '{connection['source']}'")
                return False
            
            if connection["target"] != case_id:
                print(f"❌ FAILED: Connection target was not saved correctly. Expected '{case_id}', got '{connection['target']}'")
                return False
            
            if connection["sourceHandle"] != "bottom":
                print(f"❌ FAILED: Connection sourceHandle was not saved correctly. Expected 'bottom', got '{connection['sourceHandle']}'")
                return False
            
            if connection["targetHandle"] != "top":
                print(f"❌ FAILED: Connection targetHandle was not saved correctly. Expected 'top', got '{connection['targetHandle']}'")
                return False
            
            if connection["label"] != "Test Connection Label":
                print(f"❌ FAILED: Connection label was not saved correctly. Expected 'Test Connection Label', got '{connection['label']}'")
                return False
            
            break
    
    if not found_connection:
        print(f"❌ FAILED: Connection was not found in the saved data")
        return False
    
    print(f"✅ Connection was saved correctly with all properties: source, target, sourceHandle, targetHandle, and label")
    
    # Update the connection
    for connection in verified_data["connections"]:
        if connection["id"] == connection_id:
            connection["label"] = "Updated Connection Label"
            connection["sourceHandle"] = "right"
            connection["targetHandle"] = "left"
            break
    
    update_response = requests.put(f"{BASE_URL}/mindmap-data", json=verified_data)
    if update_response.status_code != 200:
        print(f"❌ FAILED: Could not update connection, status code {update_response.status_code}")
        return False
    
    print(f"✅ Connection updated successfully")
    
    # Verify the update was saved
    final_response = requests.get(f"{BASE_URL}/mindmap-data")
    if final_response.status_code != 200:
        print(f"❌ FAILED: Could not verify updated connection, status code {final_response.status_code}")
        return False
    
    final_data = final_response.json()
    
    # Check if our connection was updated
    found_updated = False
    for connection in final_data["connections"]:
        if connection["id"] == connection_id:
            found_updated = True
            
            if connection["label"] != "Updated Connection Label":
                print(f"❌ FAILED: Connection label was not updated correctly. Expected 'Updated Connection Label', got '{connection['label']}'")
                return False
            
            if connection["sourceHandle"] != "right":
                print(f"❌ FAILED: Connection sourceHandle was not updated correctly. Expected 'right', got '{connection['sourceHandle']}'")
                return False
            
            if connection["targetHandle"] != "left":
                print(f"❌ FAILED: Connection targetHandle was not updated correctly. Expected 'left', got '{connection['targetHandle']}'")
                return False
            
            break
    
    if not found_updated:
        print(f"❌ FAILED: Updated connection was not found in the final data")
        return False
    
    print(f"✅ Connection was updated correctly with new sourceHandle, targetHandle, and label values")
    print(f"✅ Connections with sourceHandle, targetHandle, and label are properly handled")
    return True

def test_error_handling():
    """Test error handling for malformed requests"""
    print("\n🔍 Testing error handling for malformed requests")
    
    # Test with invalid JSON
    invalid_json = "This is not valid JSON"
    try:
        response = requests.put(f"{BASE_URL}/mindmap-data", data=invalid_json, headers={"Content-Type": "application/json"})
        if response.status_code < 400:  # Should be a 4xx error
            print(f"❌ FAILED: Expected error status code for invalid JSON, got {response.status_code}")
            return False
        print(f"✅ Server correctly rejected invalid JSON with status {response.status_code}")
    except Exception as e:
        print(f"❌ FAILED: Error testing invalid JSON: {e}")
        return False
    
    # Test with invalid data types
    invalid_types = {
        "topics": [{"id": 123, "title": "Invalid ID Type"}],  # ID should be string
        "cases": [],
        "tasks": [],
        "literature": [],
        "connections": []
    }
    try:
        response = requests.put(f"{BASE_URL}/mindmap-data", json=invalid_types)
        if response.status_code < 400:  # Should be a 4xx error
            print(f"❌ FAILED: Expected error status code for invalid data types, got {response.status_code}")
            return False
        print(f"✅ Server correctly rejected invalid data types with status {response.status_code}")
    except Exception as e:
        print(f"❌ FAILED: Error testing invalid data types: {e}")
        return False
    
    # Test with invalid connection (missing required fields)
    get_response = requests.get(f"{BASE_URL}/mindmap-data")
    if get_response.status_code != 200:
        print(f"❌ FAILED: Could not get current data, status code {get_response.status_code}")
        return False
    
    current_data = get_response.json()
    modified_data = current_data.copy()
    
    # Add an invalid connection (missing target)
    invalid_connection = {
        "id": f"e{uuid.uuid4().hex}",
        "source": "some-id",
        # Missing "target" field
    }
    
    if "connections" not in modified_data:
        modified_data["connections"] = []
    
    modified_data["connections"].append(invalid_connection)
    
    try:
        response = requests.put(f"{BASE_URL}/mindmap-data", json=modified_data)
        if response.status_code < 400:  # Should be a 4xx error
            print(f"❌ FAILED: Expected error status code for invalid connection, got {response.status_code}")
            return False
        print(f"✅ Server correctly rejected invalid connection with status {response.status_code}")
    except Exception as e:
        print(f"❌ FAILED: Error testing invalid connection: {e}")
        return False
    
    print(f"✅ Error handling for malformed requests works correctly")
    return True

def test_cors_configuration():
    """Test CORS configuration for localhost:3000"""
    print("\n🔍 Testing CORS configuration for localhost:3000")
    
    headers = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Content-Type"
    }
    
    # Send a preflight OPTIONS request
    try:
        response = requests.options(f"{BASE_URL}/mindmap-data", headers=headers)
        
        # Check for CORS headers in the response
        if "Access-Control-Allow-Origin" not in response.headers:
            print(f"❌ FAILED: Missing Access-Control-Allow-Origin header")
            return False
        
        if response.headers["Access-Control-Allow-Origin"] != "http://localhost:3000":
            print(f"❌ FAILED: Expected Access-Control-Allow-Origin: http://localhost:3000, got {response.headers['Access-Control-Allow-Origin']}")
            return False
        
        if "Access-Control-Allow-Methods" not in response.headers:
            print(f"❌ FAILED: Missing Access-Control-Allow-Methods header")
            return False
        
        if "Access-Control-Allow-Headers" not in response.headers:
            print(f"❌ FAILED: Missing Access-Control-Allow-Headers header")
            return False
        
        print(f"✅ CORS headers are correctly configured for localhost:3000")
        return True
    except Exception as e:
        print(f"❌ FAILED: Error testing CORS configuration: {e}")
        return False

def run_all_tests():
    """Run all tests and print a summary"""
    print("🧪 Starting Mind Map API Tests 🧪")
    print("================================")
    
    tests = [
        ("GET /api/mindmap-data endpoint", test_get_mindmap_data),
        ("PUT /api/mindmap-data endpoint", test_put_mindmap_data),
        ("Connections handling", test_connections_handling),
        ("Error handling", test_error_handling),
        ("CORS configuration", test_cors_configuration)
    ]
    
    results = []
    
    for name, test_func in tests:
        print(f"\n📋 Running test: {name}")
        print("--------------------------------")
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ FAILED with exception: {str(e)}")
            results.append((name, False))
    
    # Print summary
    print("\n📊 Test Summary:")
    print("================================")
    
    passed = 0
    failed = 0
    
    for name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status} - {name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {len(results)}, Passed: {passed}, Failed: {failed}")
    
    if failed == 0:
        print("\n✅ All tests passed! The mind map API is working correctly.")
    else:
        print(f"\n❌ {failed} test(s) failed. Please check the issues above.")
    
    return failed == 0

if __name__ == "__main__":
    run_all_tests()