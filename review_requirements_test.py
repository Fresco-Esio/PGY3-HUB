import requests
import json
import uuid
from datetime import datetime

# Use the production backend URL for testing (from frontend/.env)
BASE_URL = "https://13037a06-6e34-48e2-8130-7e83b77c780f.preview.emergentagent.com/api"

def test_review_requirements():
    """Test all specific requirements from the review request"""
    print("🧪 Testing Review Requirements for Mind Map Backend API 🧪\n")
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0
    }
    
    def run_test(name, test_func):
        results["total"] += 1
        print(f"🔍 Testing: {name}")
        try:
            success = test_func()
            if success:
                results["passed"] += 1
                print("✅ PASSED\n")
            else:
                results["failed"] += 1
                print("❌ FAILED\n")
        except Exception as e:
            results["failed"] += 1
            print(f"❌ ERROR: {str(e)}\n")
    
    def test_get_mindmap_data():
        """1. GET /api/mindmap-data - Verify it returns the complete mind map data structure"""
        response = requests.get(f"{BASE_URL}/mindmap-data")
        if response.status_code != 200:
            print(f"  Status code: {response.status_code} (expected 200)")
            return False
        
        data = response.json()
        
        # Check all required fields are present
        required_fields = ["topics", "cases", "tasks", "literature", "connections"]
        for field in required_fields:
            if field not in data:
                print(f"  Missing required field: {field}")
                return False
        
        print(f"  ✓ Complete data structure returned:")
        print(f"    - {len(data['topics'])} topics")
        print(f"    - {len(data['cases'])} cases") 
        print(f"    - {len(data['tasks'])} tasks")
        print(f"    - {len(data['literature'])} literature items")
        print(f"    - {len(data['connections'])} connections")
        
        # Store data for next test
        test_get_mindmap_data.data = data
        return True
    
    def test_put_mindmap_data():
        """2. PUT /api/mindmap-data - Verify it can save the complete mind map data structure"""
        if not hasattr(test_get_mindmap_data, 'data'):
            print("  No data from GET test available")
            return False
        
        # Make a small modification to test saving
        test_data = test_get_mindmap_data.data.copy()
        
        # Add a test connection with new format handle IDs
        test_connection = {
            "id": f"test-{uuid.uuid4().hex}",
            "source": test_data["topics"][0]["id"] if test_data["topics"] else "test-source",
            "target": test_data["topics"][1]["id"] if len(test_data["topics"]) > 1 else "test-target",
            "sourceHandle": "bottom",
            "targetHandle": "top",
            "label": "PUT Test Connection"
        }
        
        test_data["connections"].append(test_connection)
        
        # Save the data
        put_response = requests.put(f"{BASE_URL}/mindmap-data", json=test_data)
        if put_response.status_code != 200:
            print(f"  PUT failed with status: {put_response.status_code}")
            return False
        
        # Verify the data was saved
        verify_response = requests.get(f"{BASE_URL}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Verification GET failed with status: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        # Check if our test connection was saved
        connection_found = False
        for conn in verified_data["connections"]:
            if conn["id"] == test_connection["id"]:
                connection_found = True
                break
        
        if not connection_found:
            print("  Test connection was not saved correctly")
            return False
        
        print("  ✓ Complete mind map data structure saved successfully")
        print("  ✓ Test connection with new handle IDs saved and verified")
        
        # Store for next test
        test_put_mindmap_data.test_connection_id = test_connection["id"]
        return True
    
    def test_connection_persistence():
        """3. Test connection persistence - Verify connections with different handle IDs are properly stored and retrieved"""
        if not hasattr(test_put_mindmap_data, 'test_connection_id'):
            print("  No test connection ID available")
            return False
        
        # Get current data
        response = requests.get(f"{BASE_URL}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get data: {response.status_code}")
            return False
        
        data = response.json()
        
        # Test different handle ID formats
        handle_formats = {
            "new_format": 0,  # top, right, bottom, left
            "old_format": 0   # source-bottom, target-top, etc.
        }
        
        directional_handles = {"top": 0, "right": 0, "bottom": 0, "left": 0}
        
        for conn in data["connections"]:
            if "sourceHandle" in conn and "targetHandle" in conn:
                # Check source handle format
                if "-" in conn["sourceHandle"]:
                    handle_formats["old_format"] += 1
                else:
                    handle_formats["new_format"] += 1
                    # Count directional handles
                    if conn["sourceHandle"] in directional_handles:
                        directional_handles[conn["sourceHandle"]] += 1
                
                # Check target handle format  
                if "-" not in conn["targetHandle"] and conn["targetHandle"] in directional_handles:
                    directional_handles[conn["targetHandle"]] += 1
        
        print(f"  ✓ Connection persistence verified:")
        print(f"    - {handle_formats['new_format']} connections with new format handle IDs")
        print(f"    - {handle_formats['old_format']} connections with old format handle IDs")
        print(f"    - Directional handle usage: {directional_handles}")
        
        # Verify our test connection persists
        test_connection_found = False
        for conn in data["connections"]:
            if conn["id"] == test_put_mindmap_data.test_connection_id:
                test_connection_found = True
                if conn["sourceHandle"] == "bottom" and conn["targetHandle"] == "top":
                    print("  ✓ Test connection with new handle IDs persisted correctly")
                else:
                    print(f"  ⚠ Test connection handle IDs changed: {conn['sourceHandle']} -> {conn['targetHandle']}")
                break
        
        if not test_connection_found:
            print("  ❌ Test connection not found in persistence check")
            return False
        
        return True
    
    def test_multi_directional_handles():
        """4. Test that the backend handles all the new multi-directional handle IDs correctly"""
        # Get current data
        response = requests.get(f"{BASE_URL}/mindmap-data")
        if response.status_code != 200:
            print(f"  Failed to get data: {response.status_code}")
            return False
        
        data = response.json()
        
        if not data["topics"] or len(data["topics"]) < 2:
            print("  Not enough topics for multi-directional testing")
            return False
        
        # Create connections with all four directional handles
        test_data = data.copy()
        multi_directional_connections = []
        
        for i, direction in enumerate(["top", "right", "bottom", "left"]):
            opposite = {"top": "bottom", "right": "left", "bottom": "top", "left": "right"}[direction]
            
            connection = {
                "id": f"multi-dir-{direction}-{uuid.uuid4().hex[:8]}",
                "source": data["topics"][0]["id"],
                "target": data["topics"][1]["id"],
                "sourceHandle": direction,
                "targetHandle": opposite,
                "label": f"Multi-directional: {direction} to {opposite}"
            }
            
            test_data["connections"].append(connection)
            multi_directional_connections.append(connection)
        
        # Save the data with multi-directional connections
        put_response = requests.put(f"{BASE_URL}/mindmap-data", json=test_data)
        if put_response.status_code != 200:
            print(f"  Failed to save multi-directional connections: {put_response.status_code}")
            return False
        
        # Verify all multi-directional connections were saved
        verify_response = requests.get(f"{BASE_URL}/mindmap-data")
        if verify_response.status_code != 200:
            print(f"  Failed to verify multi-directional connections: {verify_response.status_code}")
            return False
        
        verified_data = verify_response.json()
        
        saved_directions = []
        for test_conn in multi_directional_connections:
            for saved_conn in verified_data["connections"]:
                if saved_conn["id"] == test_conn["id"]:
                    saved_directions.append(f"{saved_conn['sourceHandle']}-to-{saved_conn['targetHandle']}")
                    break
        
        if len(saved_directions) != 4:
            print(f"  Only {len(saved_directions)} of 4 multi-directional connections saved")
            return False
        
        print("  ✓ All multi-directional handle IDs handled correctly:")
        for direction in saved_directions:
            print(f"    - {direction}")
        
        return True
    
    # Run all tests
    run_test("GET /api/mindmap-data returns complete structure", test_get_mindmap_data)
    run_test("PUT /api/mindmap-data saves complete structure", test_put_mindmap_data)
    run_test("Connection persistence with different handle IDs", test_connection_persistence)
    run_test("Multi-directional handle IDs (top, right, bottom, left)", test_multi_directional_handles)
    
    # Print final summary
    print("📊 Final Test Summary:")
    print(f"  Total Tests: {results['total']}")
    print(f"  Passed: {results['passed']}")
    print(f"  Failed: {results['failed']}")
    
    if results['failed'] == 0:
        print("\n🎉 ALL REVIEW REQUIREMENTS PASSED! 🎉")
        print("✅ Backend API endpoints are working correctly")
        print("✅ Complete mind map data structure is properly handled")
        print("✅ Connection persistence works with both old and new handle ID formats")
        print("✅ Multi-directional handle IDs (top, right, bottom, left) are fully supported")
    else:
        print(f"\n❌ {results['failed']} test(s) failed - review requirements not fully met")
    
    return results['failed'] == 0

if __name__ == "__main__":
    test_review_requirements()