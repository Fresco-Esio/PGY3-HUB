import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './App.css';
import axios from 'axios';
import { 
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
import { 
  Plus, 
  Brain, 
  Users, 
  CheckSquare, 
  Edit3, 
  Save, 
  ArrowLeft,
  FileText,
  Calendar,
  Target
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom Node Components
const TopicNode = ({ data, selected }) => {
  return (
    <div 
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] ${
        selected 
          ? 'border-teal-400 shadow-xl scale-105' 
          : 'border-transparent hover:border-teal-300'
      }`}
      style={{ 
        backgroundColor: data.color || '#3B82F6',
        color: 'white'
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Brain size={16} />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90">{data.category}</div>
      {data.flashcard_count > 0 && (
        <div className="text-xs mt-2 bg-white bg-opacity-20 rounded px-2 py-1">
          {data.completed_flashcards}/{data.flashcard_count} flashcards
        </div>
      )}
    </div>
  );
};

const CaseNode = ({ data, selected }) => {
  return (
    <div 
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] bg-white ${
        selected 
          ? 'border-blue-400 shadow-xl scale-105' 
          : 'border-gray-200 hover:border-blue-300'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Users size={16} className="text-blue-600" />
        <div className="font-semibold text-sm text-gray-800">{data.label}</div>
      </div>
      <div className="text-xs text-gray-600">{data.diagnosis}</div>
      <div className="text-xs text-blue-600 mt-1">{data.age && `Age: ${data.age}`}</div>
    </div>
  );
};

const TaskNode = ({ data, selected }) => {
  const statusColors = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500'
  };

  return (
    <div 
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] text-white ${
        selected 
          ? 'border-yellow-400 shadow-xl scale-105' 
          : 'border-transparent hover:border-yellow-300'
      } ${statusColors[data.status] || 'bg-gray-500'}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <CheckSquare size={16} />
        <div className="font-semibold text-sm">{data.label}</div>
      </div>
      <div className="text-xs opacity-90">Priority: {data.priority}</div>
      {data.due_date && (
        <div className="text-xs mt-1 opacity-90">Due: {new Date(data.due_date).toLocaleDateString()}</div>
      )}
    </div>
  );
};

const nodeTypes = {
  topic: TopicNode,
  case: CaseNode,
  task: TaskNode,
};

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mindMapData, setMindMapData] = useState({ topics: [], cases: [], tasks: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMindMapData();
  }, []);

  const loadMindMapData = async () => {
    try {
      const response = await axios.get(`${API}/mindmap-data`);
      setMindMapData(response.data);
      convertDataToReactFlow(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading mind map data:', error);
      setLoading(false);
    }
  };

  const convertDataToReactFlow = (data) => {
    const flowNodes = [];
    const flowEdges = [];

    // Convert topics to nodes
    data.topics.forEach(topic => {
      flowNodes.push({
        id: `topic-${topic.id}`,
        type: 'topic',
        position: topic.position,
        data: {
          label: topic.title,
          category: topic.category,
          color: topic.color,
          flashcard_count: topic.flashcard_count,
          completed_flashcards: topic.completed_flashcards,
          originalData: topic
        }
      });
    });

    // Convert cases to nodes
    data.cases.forEach(caseItem => {
      flowNodes.push({
        id: `case-${caseItem.id}`,
        type: 'case',
        position: caseItem.position,
        data: {
          label: caseItem.case_id,
          diagnosis: caseItem.primary_diagnosis,
          age: caseItem.age,
          originalData: caseItem
        }
      });

      // Create edges from cases to linked topics
      caseItem.linked_topics.forEach(topicId => {
        flowEdges.push({
          id: `case-${caseItem.id}-topic-${topicId}`,
          source: `case-${caseItem.id}`,
          target: `topic-${topicId}`,
          type: 'smoothstep',
          style: { stroke: '#94A3B8', strokeWidth: 2, strokeDasharray: '5,5' }
        });
      });
    });

    // Convert tasks to nodes
    data.tasks.forEach(task => {
      flowNodes.push({
        id: `task-${task.id}`,
        type: 'task',
        position: task.position,
        data: {
          label: task.title,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          originalData: task
        }
      });

      // Create edges from tasks to linked entities
      if (task.linked_topic_id) {
        flowEdges.push({
          id: `task-${task.id}-topic-${task.linked_topic_id}`,
          source: `task-${task.id}`,
          target: `topic-${task.linked_topic_id}`,
          type: 'smoothstep',
          style: { stroke: '#F59E0B', strokeWidth: 2, strokeDasharray: '3,3' }
        });
      }

      if (task.linked_case_id) {
        flowEdges.push({
          id: `task-${task.id}-case-${task.linked_case_id}`,
          source: `task-${task.id}`,
          target: `case-${task.linked_case_id}`,
          type: 'smoothstep',
          style: { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '3,3' }
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  };

  const onNodeDoubleClick = (event, node) => {
    const [nodeType, nodeId] = node.id.split('-');
    navigate(`/${nodeType}/${nodeId}`);
  };

  const initSampleData = async () => {
    try {
      await axios.post(`${API}/init-sample-data`);
      loadMindMapData();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  };

  const saveLayout = async () => {
    try {
      // Update positions in backend
      const updates = nodes.map(node => {
        const [nodeType, nodeId] = node.id.split('-');
        return {
          type: nodeType,
          id: nodeId,
          position: node.position
        };
      });

      // Here you would batch update the positions
      console.log('Saving layout:', updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const addNewNode = (nodeType) => {
    const newPosition = { x: Math.random() * 400, y: Math.random() * 400 };
    const newId = `${nodeType}-${Date.now()}`;
    
    const newNode = {
      id: newId,
      type: nodeType,
      position: newPosition,
      data: {
        label: `New ${nodeType}`,
        ...(nodeType === 'topic' && { category: 'New Category', color: '#3B82F6' }),
        ...(nodeType === 'case' && { diagnosis: 'New Diagnosis' }),
        ...(nodeType === 'task' && { priority: 'medium', status: 'pending' })
      }
    };

    setNodes((nds) => nds.concat(newNode));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading PGY-3 HQ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl">
        <div className="mb-8">
          <div className="text-3xl font-thin tracking-wide text-white mb-1">PGY-3</div>
          <div className="text-3xl font-bold tracking-wide text-white">HQ</div>
          <div className="text-sm text-slate-300 mt-2">Psychiatry Resident Dashboard</div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2">
            <Brain size={16} />
            Topics ({mindMapData.topics.length})
          </div>
          <div className="bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2">
            <Users size={16} />
            Cases ({mindMapData.cases.length})
          </div>
          <div className="bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2">
            <CheckSquare size={16} />
            Tasks ({mindMapData.tasks.length})
          </div>
        </div>

        {/* Mind Map Controls */}
        <div className="mt-8 space-y-3">
          <div className="text-sm font-semibold text-slate-300 mb-3">Mind Map Controls</div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors ${
              isEditing 
                ? 'bg-teal-600 hover:bg-teal-700' 
                : 'bg-slate-600 hover:bg-slate-500'
            }`}
          >
            <Edit3 size={16} />
            {isEditing ? 'Exit Edit Mode' : 'Edit Mind Map'}
          </button>

          {isEditing && (
            <>
              <button
                onClick={saveLayout}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Save size={16} />
                Save Layout
              </button>

              <div className="space-y-2">
                <div className="text-xs text-slate-400">Add New Node:</div>
                <button
                  onClick={() => addNewNode('topic')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus size={14} />
                  Topic
                </button>
                <button
                  onClick={() => addNewNode('case')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-indigo-600 hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={14} />
                  Case
                </button>
                <button
                  onClick={() => addNewNode('task')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs bg-amber-600 hover:bg-amber-700 transition-colors"
                >
                  <Plus size={14} />
                  Task
                </button>
              </div>
            </>
          )}
        </div>

        {mindMapData.topics.length === 0 && (
          <div className="mt-8 p-4 bg-slate-700 bg-opacity-50 rounded-lg">
            <p className="text-sm text-slate-300 mb-3">
              No data found. Initialize with sample data to get started.
            </p>
            <button
              onClick={initSampleData}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              Initialize Sample Data
            </button>
          </div>
        )}

        {selectedNode && (
          <div className="mt-8 p-4 bg-slate-700 bg-opacity-50 rounded-lg border border-teal-500">
            <h3 className="font-semibold mb-2 text-teal-300">Selected Node</h3>
            <p className="text-sm text-slate-300 capitalize">
              <span className="font-medium">{selectedNode.type}</span>: {selectedNode.data.label}
            </p>
            <button
              onClick={() => onNodeDoubleClick(null, selectedNode)}
              className="mt-3 text-xs text-teal-400 hover:text-teal-300 underline"
            >
              View Details →
            </button>
          </div>
        )}
      </div>

      {/* Main Mind Map Workspace */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={isEditing}
          nodesConnectable={isEditing}
          elementsSelectable={true}
          className="bg-gradient-to-br from-slate-50 to-slate-100"
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'topic': return node.data.color || '#3B82F6';
                case 'case': return '#6B7280';
                case 'task': return '#F59E0B';
                default: return '#9CA3AF';
              }
            }}
          />
          
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Instructions</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Click to select nodes</div>
              <div>• Double-click to view details</div>
              <div>• {isEditing ? 'Drag to reposition' : 'Enable edit mode to drag'}</div>
              <div>• Zoom with mouse wheel</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

// Topic Detail Page
const TopicDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [relatedCases, setRelatedCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopicData();
  }, [id]);

  const loadTopicData = async () => {
    try {
      const [topicResponse, mindMapResponse] = await Promise.all([
        axios.get(`${API}/topics/${id}`),
        axios.get(`${API}/mindmap-data`)
      ]);
      
      setTopic(topicResponse.data);
      
      // Find related cases
      const related = mindMapResponse.data.cases.filter(
        case_item => case_item.linked_topics.includes(id)
      );
      setRelatedCases(related);
      setLoading(false);
    } catch (error) {
      console.error('Error loading topic data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!topic) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Topic not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Mind Map
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: topic.color }}
            ></div>
            <h1 className="text-3xl font-bold text-gray-800">{topic.title}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
                <p className="text-gray-600 leading-relaxed">
                  {topic.description || 'No description available.'}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Category</h2>
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {topic.category}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Related Patient Cases</h2>
                <div className="space-y-3">
                  {relatedCases.map(case_item => (
                    <div key={case_item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">{case_item.case_id}</h3>
                          <p className="text-sm text-gray-600">{case_item.primary_diagnosis}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/case/${case_item.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                  {relatedCases.length === 0 && (
                    <p className="text-gray-500 text-sm">No related cases found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Flashcard Progress
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{topic.completed_flashcards}/{topic.flashcard_count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${topic.flashcard_count > 0 ? (topic.completed_flashcards / topic.flashcard_count) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={16} />
                  Resource Library
                </h3>
                <div className="space-y-2">
                  {topic.resources && topic.resources.length > 0 ? (
                    topic.resources.map((resource, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-700">{resource.title}</div>
                        <div className="text-gray-500 text-xs">{resource.type}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No resources available.</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Calendar size={16} />
                  Last Updated
                </h3>
                <p className="text-sm text-gray-600">
                  {new Date(topic.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Case Detail Page (similar structure)
const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaseData();
  }, [id]);

  const loadCaseData = async () => {
    try {
      const response = await axios.get(`${API}/cases/${id}`);
      setCaseData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading case data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!caseData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Case not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Mind Map
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <Users className="text-blue-600" size={24} />
            <h1 className="text-3xl font-bold text-gray-800">{caseData.case_id}</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Primary Diagnosis</h2>
                <p className="text-gray-600">{caseData.primary_diagnosis}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Chief Complaint</h2>
                <p className="text-gray-600">{caseData.chief_complaint}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Demographics</h2>
                <div className="text-gray-600 space-y-1">
                  {caseData.age && <div>Age: {caseData.age}</div>}
                  {caseData.gender && <div>Gender: {caseData.gender}</div>}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Encounter Date</h2>
                <p className="text-gray-600">
                  {new Date(caseData.encounter_date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Status</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  caseData.status === 'active' ? 'bg-green-100 text-green-800' :
                  caseData.status === 'follow_up' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {caseData.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {caseData.medications && caseData.medications.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Medications</h2>
                  <ul className="text-gray-600 space-y-1">
                    {caseData.medications.map((med, index) => (
                      <li key={index}>• {med}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Task Detail Page (similar structure)
const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskData();
  }, [id]);

  const loadTaskData = async () => {
    try {
      const response = await axios.get(`${API}/tasks/${id}`);
      setTask(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading task data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!task) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Task not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Mind Map
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <CheckSquare className="text-amber-600" size={24} />
            <h1 className="text-3xl font-bold text-gray-800">{task.title}</h1>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">Description</h2>
              <p className="text-gray-600">{task.description || 'No description available.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  task.status === 'completed' ? 'bg-green-100 text-green-800' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Priority</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority.toUpperCase()}
                </span>
              </div>

              {task.due_date && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Due Date</h3>
                  <p className="text-gray-600">
                    {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component with Routing
function App() {
  return (
    <ReactFlowProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/topic/:id" element={<TopicDetail />} />
          <Route path="/case/:id" element={<CaseDetail />} />
          <Route path="/task/:id" element={<TaskDetail />} />
        </Routes>
      </Router>
    </ReactFlowProvider>
  );
}

export default App;