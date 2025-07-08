from fastapi import FastAPI, APIRouter, HTTPException
from starlette.middleware.cors import CORSMiddleware
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent

# Local JSON file for mind map data storage
MINDMAP_DATA_FILE = ROOT_DIR / 'mindmap_data.json'

# Create the main app
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

# Create models for requests
class LiteratureCreate(BaseModel):
    title: str
    authors: Optional[str] = None
    publication: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    notes: Optional[str] = None
    linked_topics: List[str] = Field(default_factory=list)

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

class MindMapData(BaseModel):
    topics: List[PsychiatricTopic] = Field(default_factory=list)
    cases: List[PatientCase] = Field(default_factory=list)
    tasks: List[Task] = Field(default_factory=list)
    literature: List[Literature] = Field(default_factory=list)
    connections: List[Dict[str, Any]] = Field(default_factory=list)

# Utility functions for JSON file operations
def load_mind_map_data() -> MindMapData:
    """Load mind map data from JSON file"""
    try:
        if MINDMAP_DATA_FILE.exists():
            with open(MINDMAP_DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Convert datetime strings back to datetime objects
            for topic in data.get('topics', []):
                if 'created_at' in topic:
                    topic['created_at'] = datetime.fromisoformat(topic['created_at'].replace('Z', '+00:00'))
                if 'updated_at' in topic:
                    topic['updated_at'] = datetime.fromisoformat(topic['updated_at'].replace('Z', '+00:00'))
            
            for case in data.get('cases', []):
                if 'created_at' in case:
                    case['created_at'] = datetime.fromisoformat(case['created_at'].replace('Z', '+00:00'))
                if 'updated_at' in case:
                    case['updated_at'] = datetime.fromisoformat(case['updated_at'].replace('Z', '+00:00'))
                if 'encounter_date' in case:
                    case['encounter_date'] = datetime.fromisoformat(case['encounter_date'].replace('Z', '+00:00'))
            
            for task in data.get('tasks', []):
                if 'created_at' in task:
                    task['created_at'] = datetime.fromisoformat(task['created_at'].replace('Z', '+00:00'))
                if 'updated_at' in task:
                    task['updated_at'] = datetime.fromisoformat(task['updated_at'].replace('Z', '+00:00'))
                if 'due_date' in task and task['due_date']:
                    task['due_date'] = datetime.fromisoformat(task['due_date'].replace('Z', '+00:00'))
            
            for lit in data.get('literature', []):
                if 'created_at' in lit:
                    lit['created_at'] = datetime.fromisoformat(lit['created_at'].replace('Z', '+00:00'))
                if 'updated_at' in lit:
                    lit['updated_at'] = datetime.fromisoformat(lit['updated_at'].replace('Z', '+00:00'))
            
            return MindMapData(**data)
        else:
            # Create initial dummy data if file doesn't exist
            dummy_data = create_initial_dummy_data()
            save_mind_map_data(dummy_data)
            return dummy_data
    except Exception as e:
        logger.error(f"Error loading mind map data: {e}")
        # Return empty data structure on error
        return MindMapData()

def save_mind_map_data(data: MindMapData) -> None:
    """Save mind map data to JSON file"""
    try:
        # Convert to dict and handle datetime serialization
        data_dict = data.dict()
        
        # Convert datetime objects to ISO strings
        for topic in data_dict.get('topics', []):
            if 'created_at' in topic and topic['created_at']:
                topic['created_at'] = topic['created_at'].isoformat()
            if 'updated_at' in topic and topic['updated_at']:
                topic['updated_at'] = topic['updated_at'].isoformat()
        
        for case in data_dict.get('cases', []):
            if 'created_at' in case and case['created_at']:
                case['created_at'] = case['created_at'].isoformat()
            if 'updated_at' in case and case['updated_at']:
                case['updated_at'] = case['updated_at'].isoformat()
            if 'encounter_date' in case and case['encounter_date']:
                case['encounter_date'] = case['encounter_date'].isoformat()
        
        for task in data_dict.get('tasks', []):
            if 'created_at' in task and task['created_at']:
                task['created_at'] = task['created_at'].isoformat()
            if 'updated_at' in task and task['updated_at']:
                task['updated_at'] = task['updated_at'].isoformat()
            if 'due_date' in task and task['due_date']:
                task['due_date'] = task['due_date'].isoformat()
        
        for lit in data_dict.get('literature', []):
            if 'created_at' in lit and lit['created_at']:
                lit['created_at'] = lit['created_at'].isoformat()
            if 'updated_at' in lit and lit['updated_at']:
                lit['updated_at'] = lit['updated_at'].isoformat()
        
        with open(MINDMAP_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data_dict, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info("Mind map data saved successfully")
    except Exception as e:
        logger.error(f"Error saving mind map data: {e}")
        raise HTTPException(status_code=500, detail="Failed to save data")

def create_initial_dummy_data() -> MindMapData:
    """Create initial dummy data for first-time users"""
    
    # Create sample topics
    topic1 = PsychiatricTopic(
        title="Major Depressive Disorder",
        description="Unipolar depression, treatment-resistant depression, and related mood disorders",
        category="Mood Disorders",
        color="#3B82F6",
        position={"x": 200, "y": 100},
        flashcard_count=25,
        completed_flashcards=18,
        resources=[
            {"title": "DSM-5-TR Criteria", "url": "#", "type": "reference"},
            {"title": "Treatment Guidelines", "url": "#", "type": "guideline"}
        ]
    )
    
    topic2 = PsychiatricTopic(
        title="Anxiety Disorders",
        description="GAD, panic disorder, phobias, and anxiety management",
        category="Anxiety Disorders",
        color="#059669",
        position={"x": -200, "y": 150},
        flashcard_count=20,
        completed_flashcards=15
    )
    
    # Create sample case
    case1 = PatientCase(
        case_id="CASE-001",
        encounter_date=datetime(2024, 3, 15),
        primary_diagnosis="Major Depressive Disorder, Severe",
        secondary_diagnoses=["Generalized Anxiety Disorder"],
        age=34,
        gender="Female",
        chief_complaint="I can't get out of bed anymore",
        history_present_illness="34-year-old female with 3-month history of worsening depression",
        medical_history="Hypertension, no prior psychiatric history",
        medications=["Sertraline 50mg daily", "Lisinopril 10mg daily"],
        mental_status_exam="Depressed mood, restricted affect, no SI/HI",
        assessment_plan="Increase sertraline to 100mg, CBT referral",
        notes="Good insight and judgment, strong family support",
        linked_topics=[topic1.id],
        position={"x": 300, "y": 200}
    )
    
    # Create sample task
    task1 = Task(
        title="Review MDD treatment guidelines",
        description="Read updated APA guidelines for treatment-resistant depression",
        priority="high",
        due_date=datetime(2024, 3, 20),
        linked_topic_id=topic1.id,
        position={"x": 400, "y": 50}
    )
    
    # Create sample literature
    lit1 = Literature(
        title="Efficacy of CBT in Major Depression",
        authors="Beck, A.T., Rush, A.J.",
        publication="Archives of General Psychiatry",
        year=2021,
        abstract="Comprehensive review of cognitive behavioral therapy effectiveness",
        notes="Key study for MDD treatment protocols",
        linked_topics=[topic1.id],
        position={"x": 100, "y": -100}
    )
    
    return MindMapData(
        topics=[topic1, topic2],
        cases=[case1],
        tasks=[task1],
        literature=[lit1],
        connections=[]
    )

# Basic routes
@api_router.get("/")
async def root():
    return {"message": "PGY-3 HQ API is running with local JSON storage"}

# NEW: Mind Map Data endpoints for local communication
@api_router.get("/mindmap-data")
async def get_mindmap_data():
    """Get all mind map data from local JSON file"""
    try:
        data = load_mind_map_data()
        return data.dict()
    except Exception as e:
        logger.error(f"Error getting mind map data: {e}")
        raise HTTPException(status_code=500, detail="Failed to load mind map data")

@api_router.put("/mindmap-data")
async def save_mindmap_data(data: MindMapData):
    """Save complete mind map data to local JSON file"""
    try:
        save_mind_map_data(data)
        return {"message": "Mind map data saved successfully"}
    except Exception as e:
        logger.error(f"Error saving mind map data: {e}")
        raise HTTPException(status_code=500, detail="Failed to save mind map data")

# Individual CRUD endpoints (kept for compatibility)
@api_router.get("/topics", response_model=List[PsychiatricTopic])
async def get_topics():
    data = load_mind_map_data()
    return data.topics

@api_router.get("/cases", response_model=List[PatientCase])
async def get_cases():
    data = load_mind_map_data()
    return data.cases

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks():
    data = load_mind_map_data()
    return data.tasks

@api_router.get("/literature", response_model=List[Literature])
async def get_literature():
    data = load_mind_map_data()
    return data.literature

# Include the router in the main app
app.include_router(api_router)

# CORS middleware configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specific to local frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)