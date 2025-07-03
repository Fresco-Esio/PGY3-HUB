import requests
import json
import datetime
from datetime import datetime
import uuid
import time

# Use the public endpoint for testing
BASE_URL = "https://cd6a332d-a14e-4d37-b419-166bdd01349b.preview.emergentagent.com/api"

class PsychiatryDashboardTester:
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
    
    def test_api_root(self):
        """Test the API root endpoint"""
        response = requests.get(f"{self.base_url}/")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        if "message" not in data or "PGY-3 HQ API is running" not in data["message"]:
            print(f"  Expected message about API running, got {data}")
            return False
            
        return True
    
    def test_init_sample_data(self):
        """Test initializing sample data"""
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
        """Test getting mindmap data"""
        response = requests.get(f"{self.base_url}/mindmap-data")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        data = response.json()
        # Check that the response has the expected structure
        if not all(key in data for key in ["topics", "cases", "tasks", "literature"]):
            print(f"  Missing expected keys in response: {data.keys()}")
            return False
        
        # Verify we have the expected sample data
        if len(data["topics"]) < 3:
            print(f"  Expected at least 3 topics, got {len(data['topics'])}")
            return False
            
        if len(data["cases"]) < 2:
            print(f"  Expected at least 2 cases, got {len(data['cases'])}")
            return False
            
        if len(data["tasks"]) < 3:
            print(f"  Expected at least 3 tasks, got {len(data['tasks'])}")
            return False
            
        if len(data["literature"]) < 2:
            print(f"  Expected at least 2 literature items, got {len(data['literature'])}")
            return False
        
        # Store some IDs for later tests
        self.topic_id = data["topics"][0]["id"] if data["topics"] else None
        self.case_id = data["cases"][0]["id"] if data["cases"] else None
        self.task_id = data["tasks"][0]["id"] if data["tasks"] else None
        self.literature_id = data["literature"][0]["id"] if data["literature"] else None
        
        # Print some details about the data
        print(f"  Found {len(data['topics'])} topics, {len(data['cases'])} cases, {len(data['tasks'])} tasks, {len(data['literature'])} literature items")
        if data["topics"]:
            print(f"  Sample topic: {data['topics'][0]['title']}")
        if data["cases"]:
            print(f"  Sample case: {data['cases'][0]['case_id']}")
        if data["tasks"]:
            print(f"  Sample task: {data['tasks'][0]['title']}")
        if data["literature"]:
            print(f"  Sample literature: {data['literature'][0]['title']}")
            
        return True
    
    # Topic CRUD tests
    def test_get_topics(self):
        """Test getting all topics"""
        response = requests.get(f"{self.base_url}/topics")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        topics = response.json()
        if not isinstance(topics, list):
            print(f"  Expected a list of topics, got {type(topics)}")
            return False
            
        if len(topics) < 3:  # We should have at least 3 sample topics
            print(f"  Expected at least 3 topics, got {len(topics)}")
            return False
            
        print(f"  Found {len(topics)} topics")
        return True
    
    def test_get_topic_by_id(self):
        """Test getting a topic by ID"""
        if not hasattr(self, 'topic_id') or not self.topic_id:
            print("  No topic ID available for testing")
            return False
            
        response = requests.get(f"{self.base_url}/topics/{self.topic_id}")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        topic = response.json()
        if not isinstance(topic, dict) or "id" not in topic or topic["id"] != self.topic_id:
            print(f"  Invalid topic response: {topic}")
            return False
            
        print(f"  Successfully retrieved topic: {topic['title']}")
        return True
    
    def test_create_update_delete_topic(self):
        """Test creating, updating, and deleting a topic"""
        # Create a new topic
        new_topic = {
            "title": f"Test Topic {uuid.uuid4()}",
            "description": "A test topic created by the test script",
            "category": "Test Category",
            "color": "#FF5733"
        }
        
        create_response = requests.post(f"{self.base_url}/topics", json=new_topic)
        if create_response.status_code != 200:
            print(f"  Create topic failed with status code {create_response.status_code}")
            return False
        
        created_topic = create_response.json()
        topic_id = created_topic["id"]
        print(f"  Created topic with ID: {topic_id}")
        
        # Update the topic
        update_data = {
            "description": "Updated description",
            "color": "#33FF57"
        }
        
        update_response = requests.put(f"{self.base_url}/topics/{topic_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Update topic failed with status code {update_response.status_code}")
            return False
        
        updated_topic = update_response.json()
        if updated_topic["description"] != "Updated description" or updated_topic["color"] != "#33FF57":
            print(f"  Topic was not updated correctly: {updated_topic}")
            return False
            
        print(f"  Successfully updated topic")
        
        # Delete the topic
        delete_response = requests.delete(f"{self.base_url}/topics/{topic_id}")
        if delete_response.status_code != 200:
            print(f"  Delete topic failed with status code {delete_response.status_code}")
            return False
        
        # Verify the topic is deleted
        get_response = requests.get(f"{self.base_url}/topics/{topic_id}")
        if get_response.status_code != 404:
            print(f"  Expected 404 after deletion, got {get_response.status_code}")
            return False
            
        print(f"  Successfully deleted topic")
        return True
    
    # Case CRUD tests
    def test_get_cases(self):
        """Test getting all cases"""
        response = requests.get(f"{self.base_url}/cases")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        cases = response.json()
        if not isinstance(cases, list):
            print(f"  Expected a list of cases, got {type(cases)}")
            return False
            
        if len(cases) < 2:  # We should have at least 2 sample cases
            print(f"  Expected at least 2 cases, got {len(cases)}")
            return False
            
        print(f"  Found {len(cases)} cases")
        return True
    
    def test_get_case_by_id(self):
        """Test getting a case by ID"""
        if not hasattr(self, 'case_id') or not self.case_id:
            print("  No case ID available for testing")
            return False
            
        response = requests.get(f"{self.base_url}/cases/{self.case_id}")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        case = response.json()
        if not isinstance(case, dict) or "id" not in case or case["id"] != self.case_id:
            print(f"  Invalid case response: {case}")
            return False
            
        print(f"  Successfully retrieved case: {case['case_id']}")
        return True
    
    def test_create_update_delete_case(self):
        """Test creating, updating, and deleting a case"""
        # We need a topic ID for linking
        if not hasattr(self, 'topic_id') or not self.topic_id:
            print("  No topic ID available for testing")
            return False
        
        # Create a new case
        new_case = {
            "case_id": f"TEST-{uuid.uuid4().hex[:6].upper()}",
            "encounter_date": datetime.now().isoformat(),
            "primary_diagnosis": "Test Diagnosis",
            "chief_complaint": "Test complaint",
            "linked_topics": [self.topic_id]
        }
        
        create_response = requests.post(f"{self.base_url}/cases", json=new_case)
        if create_response.status_code != 200:
            print(f"  Create case failed with status code {create_response.status_code}")
            return False
        
        created_case = create_response.json()
        case_id = created_case["id"]
        print(f"  Created case with ID: {case_id}")
        
        # Update the case
        update_data = {
            "primary_diagnosis": "Updated Diagnosis",
            "notes": "Added test notes"
        }
        
        update_response = requests.put(f"{self.base_url}/cases/{case_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Update case failed with status code {update_response.status_code}")
            return False
        
        updated_case = update_response.json()
        if updated_case["primary_diagnosis"] != "Updated Diagnosis" or updated_case["notes"] != "Added test notes":
            print(f"  Case was not updated correctly: {updated_case}")
            return False
            
        print(f"  Successfully updated case")
        
        # Delete the case
        delete_response = requests.delete(f"{self.base_url}/cases/{case_id}")
        if delete_response.status_code != 200:
            print(f"  Delete case failed with status code {delete_response.status_code}")
            return False
        
        # Verify the case is deleted
        get_response = requests.get(f"{self.base_url}/cases/{case_id}")
        if get_response.status_code != 404:
            print(f"  Expected 404 after deletion, got {get_response.status_code}")
            return False
            
        print(f"  Successfully deleted case")
        return True
    
    # Task CRUD tests
    def test_get_tasks(self):
        """Test getting all tasks"""
        response = requests.get(f"{self.base_url}/tasks")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        tasks = response.json()
        if not isinstance(tasks, list):
            print(f"  Expected a list of tasks, got {type(tasks)}")
            return False
            
        if len(tasks) < 3:  # We should have at least 3 sample tasks
            print(f"  Expected at least 3 tasks, got {len(tasks)}")
            return False
            
        print(f"  Found {len(tasks)} tasks")
        return True
    
    def test_get_task_by_id(self):
        """Test getting a task by ID"""
        if not hasattr(self, 'task_id') or not self.task_id:
            print("  No task ID available for testing")
            return False
            
        response = requests.get(f"{self.base_url}/tasks/{self.task_id}")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        task = response.json()
        if not isinstance(task, dict) or "id" not in task or task["id"] != self.task_id:
            print(f"  Invalid task response: {task}")
            return False
            
        print(f"  Successfully retrieved task: {task['title']}")
        return True
    
    def test_create_update_delete_task(self):
        """Test creating, updating, and deleting a task"""
        # We need a topic ID for linking
        if not hasattr(self, 'topic_id') or not self.topic_id:
            print("  No topic ID available for testing")
            return False
        
        # Create a new task with due date to test date formatting
        new_task = {
            "title": f"Test Task {uuid.uuid4().hex[:6]}",
            "description": "A test task created by the test script",
            "priority": "high",
            "linked_topic_id": self.topic_id,
            "due_date": datetime.now().isoformat()  # Add due date to test date formatting
        }
        
        create_response = requests.post(f"{self.base_url}/tasks", json=new_task)
        if create_response.status_code != 200:
            print(f"  Create task failed with status code {create_response.status_code}")
            return False
        
        created_task = create_response.json()
        task_id = created_task["id"]
        print(f"  Created task with ID: {task_id}")
        
        # Update the task
        update_data = {
            "description": "Updated task description",
            "status": "in_progress",
            "due_date": (datetime.now()).isoformat()  # Update due date to test date formatting
        }
        
        update_response = requests.put(f"{self.base_url}/tasks/{task_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Update task failed with status code {update_response.status_code}")
            return False
        
        updated_task = update_response.json()
        if updated_task["description"] != "Updated task description" or updated_task["status"] != "in_progress":
            print(f"  Task was not updated correctly: {updated_task}")
            return False
            
        # Verify due date was updated correctly
        if "due_date" not in updated_task or not updated_task["due_date"]:
            print(f"  Due date was not updated correctly: {updated_task}")
            return False
            
        print(f"  Successfully updated task with due date: {updated_task['due_date']}")
        
        # Delete the task
        delete_response = requests.delete(f"{self.base_url}/tasks/{task_id}")
        if delete_response.status_code != 200:
            print(f"  Delete task failed with status code {delete_response.status_code}")
            return False
        
        # Verify the task is deleted
        get_response = requests.get(f"{self.base_url}/tasks/{task_id}")
        if get_response.status_code != 404:
            print(f"  Expected 404 after deletion, got {get_response.status_code}")
            return False
            
        print(f"  Successfully deleted task")
        return True
    
    # Literature CRUD tests
    def test_get_literature(self):
        """Test getting all literature items"""
        response = requests.get(f"{self.base_url}/literature")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        literature = response.json()
        if not isinstance(literature, list):
            print(f"  Expected a list of literature items, got {type(literature)}")
            return False
            
        if len(literature) < 2:  # We should have at least 2 sample literature items
            print(f"  Expected at least 2 literature items, got {len(literature)}")
            return False
            
        print(f"  Found {len(literature)} literature items")
        return True
    
    def test_get_literature_by_id(self):
        """Test getting a literature item by ID"""
        if not hasattr(self, 'literature_id') or not self.literature_id:
            print("  No literature ID available for testing")
            return False
            
        response = requests.get(f"{self.base_url}/literature/{self.literature_id}")
        if response.status_code != 200:
            print(f"  Expected status code 200, got {response.status_code}")
            return False
        
        literature = response.json()
        if not isinstance(literature, dict) or "id" not in literature or literature["id"] != self.literature_id:
            print(f"  Invalid literature response: {literature}")
            return False
            
        print(f"  Successfully retrieved literature: {literature['title']}")
        return True
    
    def test_create_update_delete_literature(self):
        """Test creating, updating, and deleting a literature item"""
        # We need a topic ID for linking
        if not hasattr(self, 'topic_id') or not self.topic_id:
            print("  No topic ID available for testing")
            return False
        
        # Create a new literature item
        new_literature = {
            "title": f"Test Literature {uuid.uuid4().hex[:6]}",
            "authors": "Test Author",
            "publication": "Test Journal",
            "year": 2025,
            "abstract": "This is a test abstract for the literature item",
            "linked_topics": [self.topic_id]
        }
        
        create_response = requests.post(f"{self.base_url}/literature", json=new_literature)
        if create_response.status_code != 200:
            print(f"  Create literature failed with status code {create_response.status_code}")
            return False
        
        created_literature = create_response.json()
        literature_id = created_literature["id"]
        print(f"  Created literature with ID: {literature_id}")
        
        # Update the literature
        update_data = {
            "abstract": "Updated abstract for testing",
            "notes": "Added test notes"
        }
        
        update_response = requests.put(f"{self.base_url}/literature/{literature_id}", json=update_data)
        if update_response.status_code != 200:
            print(f"  Update literature failed with status code {update_response.status_code}")
            return False
        
        updated_literature = update_response.json()
        if updated_literature["abstract"] != "Updated abstract for testing" or updated_literature["notes"] != "Added test notes":
            print(f"  Literature was not updated correctly: {updated_literature}")
            return False
            
        print(f"  Successfully updated literature")
        
        # Delete the literature
        delete_response = requests.delete(f"{self.base_url}/literature/{literature_id}")
        if delete_response.status_code != 200:
            print(f"  Delete literature failed with status code {delete_response.status_code}")
            return False
        
        # Verify the literature is deleted
        get_response = requests.get(f"{self.base_url}/literature/{literature_id}")
        if get_response.status_code != 404:
            print(f"  Expected 404 after deletion, got {get_response.status_code}")
            return False
            
        print(f"  Successfully deleted literature")
        return True
    
    
    def run_all_tests(self):
        """Run all tests and print a summary"""
        print("🧪 Starting PGY-3 HQ Psychiatry Dashboard API Tests 🧪")
        
        # Basic API tests
        self.run_test("API Root Endpoint", self.test_api_root)
        self.run_test("Initialize Sample Data", self.test_init_sample_data)
        self.run_test("Get Mind Map Data", self.test_get_mindmap_data)
        
        # Topic CRUD tests
        self.run_test("Get All Topics", self.test_get_topics)
        self.run_test("Get Topic by ID", self.test_get_topic_by_id)
        self.run_test("Create, Update, Delete Topic", self.test_create_update_delete_topic)
        
        # Case CRUD tests
        self.run_test("Get All Cases", self.test_get_cases)
        self.run_test("Get Case by ID", self.test_get_case_by_id)
        self.run_test("Create, Update, Delete Case", self.test_create_update_delete_case)
        
        # Task CRUD tests
        self.run_test("Get All Tasks", self.test_get_tasks)
        self.run_test("Get Task by ID", self.test_get_task_by_id)
        self.run_test("Create, Update, Delete Task", self.test_create_update_delete_task)
        
        # Literature CRUD tests
        self.run_test("Get All Literature", self.test_get_literature)
        self.run_test("Get Literature by ID", self.test_get_literature_by_id)
        self.run_test("Create, Update, Delete Literature", self.test_create_update_delete_literature)
        
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
    tester = PsychiatryDashboardTester(BASE_URL)
    success = tester.run_all_tests()
    print("\n" + ("✅ All tests passed!" if success else "❌ Some tests failed!"))