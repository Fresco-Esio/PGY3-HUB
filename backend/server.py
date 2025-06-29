from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"

class CaseStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    FOLLOW_UP = "follow_up"

# Models
class Literature(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    authors: Optional[str] = None
    publication: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    notes: Optional[str] = None
    linked_topics: List[str] = Field(default_factory=list)  # Topic IDs
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PsychiatricTopic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    category: str  # e.g., "Mood Disorders", "Psychotic Disorders", etc.
    color: str = "#3B82F6"  # Hex color for mind map node
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    flashcard_count: int = 0
    completed_flashcards: int = 0
    resources: List[Dict[str, str]] = Field(default_factory=list)  # [{"title": "", "url": "", "type": ""}]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PatientCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str  # e.g., "CASE-001"
    encounter_date: datetime
    primary_diagnosis: str
    secondary_diagnoses: List[str] = Field(default_factory=list)
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint: str
    history_present_illness: Optional[str] = None
    medical_history: Optional[str] = None
    medications: List[str] = Field(default_factory=list)
    mental_status_exam: Optional[str] = None
    assessment_plan: Optional[str] = None
    notes: Optional[str] = None
    status: CaseStatus = CaseStatus.ACTIVE
    linked_topics: List[str] = Field(default_factory=list)  # Topic IDs
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: str = "medium"  # low, medium, high
    due_date: Optional[datetime] = None
    linked_case_id: Optional[str] = None
    linked_topic_id: Optional[str] = None
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Create models
class PsychiatricTopicCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    color: str = "#3B82F6"
    flashcard_count: int = 0

class PatientCaseCreate(BaseModel):
    case_id: str
    encounter_date: datetime
    primary_diagnosis: str
    secondary_diagnoses: List[str] = Field(default_factory=list)
    age: Optional[int] = None
    gender: Optional[str] = None
    chief_complaint: str
    history_present_illness: Optional[str] = None
    medical_history: Optional[str] = None
    medications: List[str] = Field(default_factory=list)
    mental_status_exam: Optional[str] = None
    assessment_plan: Optional[str] = None
    notes: Optional[str] = None
    linked_topics: List[str] = Field(default_factory=list)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None
    linked_case_id: Optional[str] = None
    linked_topic_id: Optional[str] = None

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "PGY-3 HQ API is running"}

# Psychiatric Topics routes
@api_router.post("/topics", response_model=PsychiatricTopic)
async def create_topic(topic: PsychiatricTopicCreate):
    topic_dict = topic.dict()
    topic_obj = PsychiatricTopic(**topic_dict)
    await db.psychiatric_topics.insert_one(topic_obj.dict())
    return topic_obj

@api_router.get("/topics", response_model=List[PsychiatricTopic])
async def get_topics():
    topics = await db.psychiatric_topics.find().to_list(1000)
    return [PsychiatricTopic(**topic) for topic in topics]

@api_router.get("/topics/{topic_id}", response_model=PsychiatricTopic)
async def get_topic(topic_id: str):
    topic = await db.psychiatric_topics.find_one({"id": topic_id})
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return PsychiatricTopic(**topic)

@api_router.put("/topics/{topic_id}", response_model=PsychiatricTopic)
async def update_topic(topic_id: str, topic_update: dict):
    topic_update["updated_at"] = datetime.utcnow()
    result = await db.psychiatric_topics.update_one(
        {"id": topic_id}, 
        {"$set": topic_update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    
    updated_topic = await db.psychiatric_topics.find_one({"id": topic_id})
    return PsychiatricTopic(**updated_topic)

@api_router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str):
    result = await db.psychiatric_topics.delete_one({"id": topic_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Topic not found")
    return {"message": "Topic deleted successfully"}

# Patient Cases routes
@api_router.post("/cases", response_model=PatientCase)
async def create_case(case: PatientCaseCreate):
    case_dict = case.dict()
    case_obj = PatientCase(**case_dict)
    await db.patient_cases.insert_one(case_obj.dict())
    return case_obj

@api_router.get("/cases", response_model=List[PatientCase])
async def get_cases():
    cases = await db.patient_cases.find().to_list(1000)
    return [PatientCase(**case) for case in cases]

@api_router.get("/cases/{case_id}", response_model=PatientCase)
async def get_case(case_id: str):
    case = await db.patient_cases.find_one({"id": case_id})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return PatientCase(**case)

@api_router.put("/cases/{case_id}", response_model=PatientCase)
async def update_case(case_id: str, case_update: dict):
    case_update["updated_at"] = datetime.utcnow()
    result = await db.patient_cases.update_one(
        {"id": case_id}, 
        {"$set": case_update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    updated_case = await db.patient_cases.find_one({"id": case_id})
    return PatientCase(**updated_case)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str):
    result = await db.patient_cases.delete_one({"id": case_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    return {"message": "Case deleted successfully"}

# Tasks routes
@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    task_dict = task.dict()
    task_obj = Task(**task_dict)
    await db.tasks.insert_one(task_obj.dict())
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    tasks = await db.tasks.find().to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: dict):
    task_update["updated_at"] = datetime.utcnow()
    result = await db.tasks.update_one(
        {"id": task_id}, 
        {"$set": task_update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

# Mind Map Data endpoint
@api_router.get("/mindmap-data")
async def get_mindmap_data():
    topics = await db.psychiatric_topics.find().to_list(1000)
    cases = await db.patient_cases.find().to_list(1000)
    tasks = await db.tasks.find().to_list(1000)
    
    return {
        "topics": [PsychiatricTopic(**topic) for topic in topics],
        "cases": [PatientCase(**case) for case in cases],
        "tasks": [Task(**task) for task in tasks]
    }

# Initialize sample data
@api_router.post("/init-sample-data")
async def init_sample_data():
    # Clear existing data
    await db.psychiatric_topics.delete_many({})
    await db.patient_cases.delete_many({})
    await db.tasks.delete_many({})
    
    # Sample topics
    sample_topics = [
        {
            "title": "Major Depressive Disorder",
            "description": "Unipolar depression, treatment-resistant depression, and related mood disorders",
            "category": "Mood Disorders",
            "color": "#3B82F6",
            "position": {"x": 200, "y": 100},
            "flashcard_count": 25,
            "completed_flashcards": 18,
            "resources": [
                {"title": "DSM-5-TR Criteria", "url": "#", "type": "reference"},
                {"title": "Treatment Guidelines", "url": "#", "type": "guideline"}
            ]
        },
        {
            "title": "Schizophrenia Spectrum",
            "description": "Schizophrenia, brief psychotic disorder, and delusional disorders",
            "category": "Psychotic Disorders",
            "color": "#DC2626",
            "position": {"x": -200, "y": 150},
            "flashcard_count": 30,
            "completed_flashcards": 22,
            "resources": [
                {"title": "Antipsychotic Guidelines", "url": "#", "type": "guideline"}
            ]
        },
        {
            "title": "Anxiety Disorders",
            "description": "GAD, panic disorder, phobias, and anxiety management",
            "category": "Anxiety Disorders",
            "color": "#059669",
            "position": {"x": 0, "y": -150},
            "flashcard_count": 20,
            "completed_flashcards": 15
        }
    ]
    
    # Insert topics and get their IDs
    topic_ids = []
    for topic_data in sample_topics:
        topic_obj = PsychiatricTopic(**topic_data)
        await db.psychiatric_topics.insert_one(topic_obj.dict())
        topic_ids.append(topic_obj.id)
    
    # Sample cases
    sample_cases = [
        {
            "case_id": "CASE-001",
            "encounter_date": datetime(2024, 3, 15),
            "primary_diagnosis": "Major Depressive Disorder, Severe",
            "secondary_diagnoses": ["Generalized Anxiety Disorder"],
            "age": 34,
            "gender": "Female",
            "chief_complaint": "I can't get out of bed anymore",
            "history_present_illness": "34-year-old female with 3-month history of worsening depression",
            "medical_history": "Hypertension, no prior psychiatric history",
            "medications": ["Sertraline 50mg daily", "Lisinopril 10mg daily"],
            "mental_status_exam": "Depressed mood, restricted affect, no SI/HI",
            "assessment_plan": "Increase sertraline to 100mg, CBT referral",
            "notes": "Good insight and judgment, strong family support",
            "linked_topics": [topic_ids[0]],
            "position": {"x": 300, "y": 200}
        },
        {
            "case_id": "CASE-002", 
            "encounter_date": datetime(2024, 3, 10),
            "primary_diagnosis": "Schizophrenia, Paranoid Type",
            "age": 28,
            "gender": "Male",
            "chief_complaint": "They're watching me through the cameras",
            "history_present_illness": "28-year-old male with 2-week history of paranoid delusions",
            "medications": ["Risperidone 2mg BID"],
            "mental_status_exam": "Paranoid delusions, auditory hallucinations present",
            "assessment_plan": "Increase risperidone, social work consultation",
            "linked_topics": [topic_ids[1]],
            "position": {"x": -300, "y": 250}
        }
    ]
    
    case_ids = []
    for case_data in sample_cases:
        case_obj = PatientCase(**case_data)
        await db.patient_cases.insert_one(case_obj.dict())
        case_ids.append(case_obj.id)
    
    # Sample tasks
    sample_tasks = [
        {
            "title": "Review MDD treatment guidelines",
            "description": "Read updated APA guidelines for treatment-resistant depression",
            "priority": "high",
            "due_date": datetime(2024, 3, 20),
            "linked_topic_id": topic_ids[0],
            "position": {"x": 400, "y": 50}
        },
        {
            "title": "Follow up with CASE-001",
            "description": "Check medication compliance and side effects",
            "priority": "medium",
            "due_date": datetime(2024, 3, 22),
            "linked_case_id": case_ids[0],
            "position": {"x": 450, "y": 300}
        },
        {
            "title": "Study antipsychotic mechanisms",
            "description": "Review D2 receptor blockade and side effect profiles",
            "priority": "medium",
            "linked_topic_id": topic_ids[1],
            "position": {"x": -400, "y": 100}
        }
    ]
    
    for task_data in sample_tasks:
        task_obj = Task(**task_data)
        await db.tasks.insert_one(task_obj.dict())
    
    return {"message": "Sample data initialized successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()