import requests
import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Use the public endpoint for testing
BASE_URL = "https://d079a299-d109-44a5-8380-50d81d53784f.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_connection_persistence():
    """Test the connection persistence fix in the psychiatry resident dashboard"""
    print("🧪 Starting Connection Persistence Test 🧪")
    
    # Initialize test data
    init_sample_data()
    
    # Setup Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Navigate to the application
        driver.get(BASE_URL)
        print("✅ Navigated to the application")
        
        # Wait for the mind map to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".react-flow"))
        )
        print("✅ Mind map loaded")
        
        # Enter edit mode
        edit_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Edit')]"))
        )
        edit_button.click()
        print("✅ Entered edit mode")
        
        # Wait for edit mode to be active
        time.sleep(2)
        
        # Create a new connection by simulating drag and drop
        # This is complex to automate with Selenium, so we'll use JavaScript to directly
        # trigger the connection creation logic
        
        # First, get the node IDs from the mind map data
        response = requests.get(f"{API_URL}/mindmap-data")
        mind_map_data = response.json()
        
        topic_id = mind_map_data["topics"][0]["id"] if mind_map_data["topics"] else None
        case_id = mind_map_data["cases"][0]["id"] if mind_map_data["cases"] else None
        task_id = mind_map_data["tasks"][0]["id"] if mind_map_data["tasks"] else None
        literature_id = mind_map_data["literature"][0]["id"] if mind_map_data["literature"] else None
        
        if not all([topic_id, case_id, task_id, literature_id]):
            print("❌ Missing required node IDs for testing")
            return False
        
        # Create a Topic → Literature connection using JavaScript
        connection_script = f"""
        const reactFlowInstance = document.querySelector('.__rf').reactFlow;
        if (reactFlowInstance) {{
            const params = {{
                source: 'topic-{topic_id}',
                sourceHandle: 'source-bottom',
                target: 'literature-{literature_id}',
                targetHandle: 'target-top'
            }};
            reactFlowInstance.onConnect(params);
            return true;
        }}
        return false;
        """
        
        connection_created = driver.execute_script(connection_script)
        if connection_created:
            print("✅ Created Topic → Literature connection")
        else:
            print("❌ Failed to create connection")
            return False
        
        # Wait for auto-save
        time.sleep(2)
        
        # Create a Topic → Case connection
        connection_script = f"""
        const reactFlowInstance = document.querySelector('.__rf').reactFlow;
        if (reactFlowInstance) {{
            const params = {{
                source: 'topic-{topic_id}',
                sourceHandle: 'source-right',
                target: 'case-{case_id}',
                targetHandle: 'target-left'
            }};
            reactFlowInstance.onConnect(params);
            return true;
        }}
        return false;
        """
        
        connection_created = driver.execute_script(connection_script)
        if connection_created:
            print("✅ Created Topic → Case connection")
        else:
            print("❌ Failed to create connection")
            return False
        
        # Wait for auto-save
        time.sleep(2)
        
        # Create a Topic → Task connection
        connection_script = f"""
        const reactFlowInstance = document.querySelector('.__rf').reactFlow;
        if (reactFlowInstance) {{
            const params = {{
                source: 'topic-{topic_id}',
                sourceHandle: 'source-bottom',
                target: 'task-{task_id}',
                targetHandle: 'target-top'
            }};
            reactFlowInstance.onConnect(params);
            return true;
        }}
        return false;
        """
        
        connection_created = driver.execute_script(connection_script)
        if connection_created:
            print("✅ Created Topic → Task connection")
        else:
            print("❌ Failed to create connection")
            return False
        
        # Wait for auto-save
        time.sleep(2)
        
        # Check console logs for successful updates
        logs = driver.get_log('browser')
        success_messages = [log for log in logs if "Successfully updated mindMapData with new connection" in log.get('message', '')]
        if success_messages:
            print("✅ Found success messages in console logs")
        else:
            print("⚠️ No success messages found in console logs")
        
        # Test Mode Change Persistence
        # Exit edit mode
        view_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'View')]"))
        )
        view_button.click()
        print("✅ Exited edit mode")
        
        # Wait for view mode to be active
        time.sleep(2)
        
        # Check if connections are still visible
        edge_count_script = """
        const edges = document.querySelectorAll('.react-flow__edge');
        return edges.length;
        """
        
        edge_count = driver.execute_script(edge_count_script)
        print(f"Found {edge_count} connections in view mode")
        
        if edge_count >= 3:  # We created 3 connections
            print("✅ Connections persisted after mode change")
        else:
            print("❌ Some connections disappeared after mode change")
            return False
        
        # Re-enter edit mode
        edit_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Edit')]"))
        )
        edit_button.click()
        print("✅ Re-entered edit mode")
        
        # Wait for edit mode to be active
        time.sleep(2)
        
        # Check if connections are still visible in edit mode
        edge_count = driver.execute_script(edge_count_script)
        print(f"Found {edge_count} connections after re-entering edit mode")
        
        if edge_count >= 3:
            print("✅ Connections persisted after re-entering edit mode")
        else:
            print("❌ Some connections disappeared after re-entering edit mode")
            return False
        
        # Test Page Refresh Persistence
        # Refresh the page
        driver.refresh()
        print("✅ Refreshed the page")
        
        # Wait for the mind map to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".react-flow"))
        )
        print("✅ Mind map reloaded")
        
        # Check if connections are still visible after refresh
        time.sleep(3)  # Give time for connections to load
        
        edge_count = driver.execute_script(edge_count_script)
        print(f"Found {edge_count} connections after page refresh")
        
        if edge_count >= 3:
            print("✅ Connections persisted after page refresh")
        else:
            print("❌ Some connections disappeared after page refresh")
            return False
        
        # Test Connection Deletion
        # Enter edit mode if not already in it
        try:
            edit_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Edit')]"))
            )
            edit_button.click()
            print("✅ Entered edit mode for deletion test")
            time.sleep(2)
        except:
            print("Already in edit mode")
        
        # Delete a connection using JavaScript
        delete_script = """
        const edges = document.querySelectorAll('.react-flow__edge');
        if (edges.length > 0) {
            const edge = edges[0];
            const edgeId = edge.getAttribute('data-testid').split('__').pop();
            
            const reactFlowInstance = document.querySelector('.__rf').reactFlow;
            if (reactFlowInstance) {
                // Simulate double-click on edge
                const edgeObj = reactFlowInstance.getEdge(edgeId);
                if (edgeObj) {
                    // Bypass confirmation dialog
                    window.confirm = function() { return true; };
                    reactFlowInstance.onEdgeDoubleClick({}, edgeObj);
                    return true;
                }
            }
        }
        return false;
        """
        
        edge_deleted = driver.execute_script(delete_script)
        if edge_deleted:
            print("✅ Deleted a connection")
        else:
            print("⚠️ Failed to delete connection")
        
        # Wait for auto-save
        time.sleep(2)
        
        # Check if deletion persisted
        edge_count_after_delete = driver.execute_script(edge_count_script)
        print(f"Found {edge_count_after_delete} connections after deletion")
        
        if edge_count_after_delete < edge_count:
            print("✅ Connection deletion persisted")
        else:
            print("❌ Connection deletion did not persist")
            return False
        
        # Exit edit mode
        view_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'View')]"))
        )
        view_button.click()
        print("✅ Exited edit mode after deletion")
        
        # Wait for view mode to be active
        time.sleep(2)
        
        # Check if deletion persisted in view mode
        edge_count_view = driver.execute_script(edge_count_script)
        print(f"Found {edge_count_view} connections in view mode after deletion")
        
        if edge_count_view == edge_count_after_delete:
            print("✅ Connection deletion persisted in view mode")
        else:
            print("❌ Connection deletion did not persist in view mode")
            return False
        
        # Refresh the page to test deletion persistence
        driver.refresh()
        print("✅ Refreshed the page after deletion")
        
        # Wait for the mind map to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".react-flow"))
        )
        print("✅ Mind map reloaded after deletion")
        
        # Wait for connections to load
        time.sleep(3)
        
        # Check if deletion persisted after refresh
        edge_count_refresh = driver.execute_script(edge_count_script)
        print(f"Found {edge_count_refresh} connections after refresh following deletion")
        
        if edge_count_refresh == edge_count_view:
            print("✅ Connection deletion persisted after page refresh")
        else:
            print("❌ Connection deletion did not persist after page refresh")
            return False
        
        print("\n🎉 All connection persistence tests passed! 🎉")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False
    
    finally:
        # Clean up
        driver.quit()

def init_sample_data():
    """Initialize sample data for testing"""
    try:
        response = requests.post(f"{API_URL}/init-sample-data")
        if response.status_code == 200:
            print("✅ Sample data initialized")
            return True
        else:
            print(f"❌ Failed to initialize sample data: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error initializing sample data: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection_persistence()