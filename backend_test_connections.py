import requests
import json
import uuid
from datetime import datetime

# Use the public endpoint for testing
BASE_URL = "https://3cf0139c-476c-401f-af0d-8e08ead3b2f5.preview.emergentagent.com/api"

class ConnectionPersistenceTester:
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
            
        self.test_results["details"].append({
            "name": name,
            "status": status
        })
        
        print(f"{status}")
        return result
    
    def test_init_sample_data(self):
        """Initialize sample data for testing"""
        response = requests.post(f"{self.base_url}/init-sample-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data or "Sample data initialized successfully" not in data["message"]:
            print(f"  Expected success message, got {data}")
            return False
            
        return True
    
    def test_get_mindmap_data(self):
        """Get mindmap data and store IDs for testing"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        # Check that the response has the expected structure
        if not all(key in data for key in ["topics", "cases", "tasks", "literature"]):
            print(f"  Missing expected keys in response: {data.keys()}")
            return False
        
        # Store IDs for later tests
        self.topic_ids = [topic["id"] for topic in data["topics"]] if data["topics"] else []
        self.case_ids = [case["id"] for case in data["cases"]] if data["cases"] else []
        self.task_ids = [task["id"] for task in data["tasks"]] if data["tasks"] else []
        self.literature_ids = [lit["id"] for lit in data["literature"]] if data["literature"] else []
        
        # Print some details about the data
        print(f"  Found {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature items")
        
        # Check if there are existing connections
        connections_count = 0
        for lit in data["literature"]:
            if lit.get("linked_topics") and len(lit["linked_topics"]) > 0:
                connections_count += len(lit["linked_topics"])
                print(f"  Literature '{lit['title']}' has {len(lit['linked_topics'])} topic connections")
        
        for case in data["cases"]:
            if case.get("linked_topics") and len(case["linked_topics"]) > 0:
                connections_count += len(case["linked_topics"])
                print(f"  Case '{case['case_id']}' has {len(case['linked_topics'])} topic connections")
        
        for task in data["tasks"]:
            if task.get("linked_case_id"):
                connections_count += 1
                print(f"  Task '{task['title']}' has a case connection")
            if task.get("linked_topic_id"):
                connections_count += 1
                print(f"  Task '{task['title']}' has a topic connection")
        
        print(f"  Total connections found: {connections_count}")
        self.initial_connections_count = connections_count
            
        return True
    
    def test_create_topic_to_case_connection(self):
        """Test creating a connection from a topic to a case"""
        if not self.topic_ids or not self.case_ids:
            print("  No topics or cases available for testing")
            return False
        
        # Get the first topic and case
        topic_id = self.topic_ids[0]
        case_id = self.case_ids[0]
        
        # Get the current case data
        response = requests.get(f"{self.base_url}/cases/{case_id}")
        if response.status_code != 200:
            print(f"  Failed to get case data: {response.status_code}")
            return False
        
        case_data = response.json()
        
        # Check if the topic is already linked
        linked_topics = case_data.get("linked_topics", [])
        if topic_id in linked_topics:
            print(f"  Topic {topic_id} is already linked to case {case_id}")
            # Remove the connection to test adding it
            linked_topics.remove(topic_id)
            update_data = {"linked_topics": linked_topics}
            update_response = requests.put(f"{self.base_url}/cases/{case_id}", json=update_data)
            if update_response.status_code != 200:
                print(f"  Failed to remove existing connection: {update_response.status_code}")
                return False
            print(f"  Removed existing connection for testing")
        
        # Add the topic to the case's linked_topics
        update_data = {"linked_topics": linked_topics + [topic_id]}
        update_response = requests.put(f"{self.base_url}/cases/{case_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Failed to update case with new connection: {update_response.status_code}")
            return False
        
        # Verify the connection was created
        verify_response = requests.get(f"{self.base_url}/cases/{case_id}")
        if verify_response.status_code != 200:
            print(f"  Failed to verify connection: {verify_response.status_code}")
            return False
        
        updated_case = verify_response.json()
        if topic_id not in updated_case.get("linked_topics", []):
            print(f"  Connection was not created: {updated_case}")
            return False
        
        print(f"  Successfully created connection from topic {topic_id} to case {case_id}")
        return True
    
    def test_create_topic_to_literature_connection(self):
        """Test creating a connection from a topic to literature"""
        if not self.topic_ids or not self.literature_ids:
            print("  No topics or literature available for testing")
            return False
        
        # Get the first topic and literature
        topic_id = self.topic_ids[0]
        literature_id = self.literature_ids[0]
        
        # Get the current literature data
        response = requests.get(f"{self.base_url}/literature/{literature_id}")
        if response.status_code != 200:
            print(f"  Failed to get literature data: {response.status_code}")
            return False
        
        literature_data = response.json()
        
        # Check if the topic is already linked
        linked_topics = literature_data.get("linked_topics", [])
        if topic_id in linked_topics:
            print(f"  Topic {topic_id} is already linked to literature {literature_id}")
            # Remove the connection to test adding it
            linked_topics.remove(topic_id)
            update_data = {"linked_topics": linked_topics}
            update_response = requests.put(f"{self.base_url}/literature/{literature_id}", json=update_data)
            if update_response.status_code != 200:
                print(f"  Failed to remove existing connection: {update_response.status_code}")
                return False
            print(f"  Removed existing connection for testing")
        
        # Add the topic to the literature's linked_topics
        update_data = {"linked_topics": linked_topics + [topic_id]}
        update_response = requests.put(f"{self.base_url}/literature/{literature_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Failed to update literature with new connection: {update_response.status_code}")
            return False
        
        # Verify the connection was created
        verify_response = requests.get(f"{self.base_url}/literature/{literature_id}")
        if verify_response.status_code != 200:
            print(f"  Failed to verify connection: {verify_response.status_code}")
            return False
        
        updated_literature = verify_response.json()
        if topic_id not in updated_literature.get("linked_topics", []):
            print(f"  Connection was not created: {updated_literature}")
            return False
        
        print(f"  Successfully created connection from topic {topic_id} to literature {literature_id}")
        return True
    
    def test_create_case_to_task_connection(self):
        """Test creating a connection from a case to a task"""
        if not self.case_ids or not self.task_ids:
            print("  No cases or tasks available for testing")
            return False
        
        # Get the first case and task
        case_id = self.case_ids[0]
        task_id = self.task_ids[0]
        
        # Get the current task data
        response = requests.get(f"{self.base_url}/tasks/{task_id}")
        if response.status_code != 200:
            print(f"  Failed to get task data: {response.status_code}")
            return False
        
        task_data = response.json()
        
        # Check if the case is already linked
        if task_data.get("linked_case_id") == case_id:
            print(f"  Case {case_id} is already linked to task {task_id}")
            # Remove the connection to test adding it
            update_data = {"linked_case_id": None}
            update_response = requests.put(f"{self.base_url}/tasks/{task_id}", json=update_data)
            if update_response.status_code != 200:
                print(f"  Failed to remove existing connection: {update_response.status_code}")
                return False
            print(f"  Removed existing connection for testing")
        
        # Add the case to the task's linked_case_id
        update_data = {"linked_case_id": case_id}
        update_response = requests.put(f"{self.base_url}/tasks/{task_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Failed to update task with new connection: {update_response.status_code}")
            return False
        
        # Verify the connection was created
        verify_response = requests.get(f"{self.base_url}/tasks/{task_id}")
        if verify_response.status_code != 200:
            print(f"  Failed to verify connection: {verify_response.status_code}")
            return False
        
        updated_task = verify_response.json()
        if updated_task.get("linked_case_id") != case_id:
            print(f"  Connection was not created: {updated_task}")
            return False
        
        print(f"  Successfully created connection from case {case_id} to task {task_id}")
        return True
    
    def test_create_topic_to_task_connection(self):
        """Test creating a connection from a topic to a task"""
        if not self.topic_ids or not self.task_ids:
            print("  No topics or tasks available for testing")
            return False
        
        # Get the first topic and task
        topic_id = self.topic_ids[0]
        task_id = self.task_ids[0]
        
        # Get the current task data
        response = requests.get(f"{self.base_url}/tasks/{task_id}")
        if response.status_code != 200:
            print(f"  Failed to get task data: {response.status_code}")
            return False
        
        task_data = response.json()
        
        # Check if the topic is already linked
        if task_data.get("linked_topic_id") == topic_id:
            print(f"  Topic {topic_id} is already linked to task {task_id}")
            # Remove the connection to test adding it
            update_data = {"linked_topic_id": None}
            update_response = requests.put(f"{self.base_url}/tasks/{task_id}", json=update_data)
            if update_response.status_code != 200:
                print(f"  Failed to remove existing connection: {update_response.status_code}")
                return False
            print(f"  Removed existing connection for testing")
        
        # Add the topic to the task's linked_topic_id
        update_data = {"linked_topic_id": topic_id}
        update_response = requests.put(f"{self.base_url}/tasks/{task_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Failed to update task with new connection: {update_response.status_code}")
            return False
        
        # Verify the connection was created
        verify_response = requests.get(f"{self.base_url}/tasks/{task_id}")
        if verify_response.status_code != 200:
            print(f"  Failed to verify connection: {verify_response.status_code}")
            return False
        
        updated_task = verify_response.json()
        if updated_task.get("linked_topic_id") != topic_id:
            print(f"  Connection was not created: {updated_task}")
            return False
        
        print(f"  Successfully created connection from topic {topic_id} to task {task_id}")
        return True
    
    def test_verify_connections_in_mindmap_data(self):
        """Verify that all connections are present in the mindmap data"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Count connections
        connections_count = 0
        for lit in data["literature"]:
            if lit.get("linked_topics") and len(lit["linked_topics"]) > 0:
                connections_count += len(lit["linked_topics"])
        
        for case in data["cases"]:
            if case.get("linked_topics") and len(case["linked_topics"]) > 0:
                connections_count += len(case["linked_topics"])
        
        for task in data["tasks"]:
            if task.get("linked_case_id"):
                connections_count += 1
            if task.get("linked_topic_id"):
                connections_count += 1
        
        print(f"  Initial connections count: {self.initial_connections_count}")
        print(f"  Current connections count: {connections_count}")
        
        # We should have at least as many connections as we started with
        if connections_count < self.initial_connections_count:
            print(f"  Expected at least {self.initial_connections_count} connections, got {connections_count}")
            return False
        
        return True
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting Connection Persistence Tests 🧪")
        
        # Initialize data and get IDs
        self.run_test("Initialize Sample Data", self.test_init_sample_data)
        self.run_test("Get Mind Map Data", self.test_get_mindmap_data)
        
        # Test creating different types of connections
        self.run_test("Create Topic to Case Connection", self.test_create_topic_to_case_connection)
        self.run_test("Create Topic to Literature Connection", self.test_create_topic_to_literature_connection)
        self.run_test("Create Case to Task Connection", self.test_create_case_to_task_connection)
        self.run_test("Create Topic to Task Connection", self.test_create_topic_to_task_connection)
        
        # Verify all connections are present in the mindmap data
        self.run_test("Verify Connections in Mind Map Data", self.test_verify_connections_in_mindmap_data)
        
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
    tester = ConnectionPersistenceTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ All tests passed!" if success else "❌ Some tests failed!"))