import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './App.css';
import axios from 'axios';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  Handle,
  Position,
  useReactFlow,
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
  Target,
  BookOpen,
  Trash2,
  X
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Custom Node Components with Connection Handles and Enhanced Hover
const TopicNode = ({ data, selected }) => {
  return (
    <div 
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] relative hover:shadow-2xl hover:scale-105 ${
        selected 
          ? 'border-teal-400 shadow-xl scale-105 ring-4 ring-teal-200' 
          : 'border-transparent hover:border-teal-300 hover:ring-2 hover:ring-teal-100'
      }`}
      style={{ 
        backgroundColor: data.color || '#3B82F6',
        color: 'white'
      }}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-white border-2 border-current" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-white border-2 border-current" />
      <Handle type="source" position={Position.Left} className="w-3 h-3 !bg-white border-2 border-current" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-white border-2 border-current" />
      
      <div className="flex items-center gap-2 mb-1">
        <Brain size={16} />
        <div className="font-semibold text-sm">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X size={12} />
          </button>
        )}
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
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] bg-white relative hover:shadow-2xl hover:scale-105 ${
        selected 
          ? 'border-blue-400 shadow-xl scale-105 ring-4 ring-blue-200' 
          : 'border-gray-200 hover:border-blue-300 hover:ring-2 hover:ring-blue-100'
      }`}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500" />
      <Handle type="target" position={Position.Right} className="w-3 h-3 !bg-blue-500" />
      
      <div className="flex items-center gap-2 mb-1">
        <Users size={16} className="text-blue-600" />
        <div className="font-semibold text-sm text-gray-800">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="ml-auto p-1 hover:bg-gray-200 rounded"
          >
            <X size={12} />
          </button>
        )}
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
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] text-white relative hover:shadow-2xl hover:scale-105 ${
        selected 
          ? 'border-yellow-400 shadow-xl scale-105 ring-4 ring-yellow-200' 
          : 'border-transparent hover:border-yellow-300 hover:ring-2 hover:ring-yellow-100'
      } ${statusColors[data.status] || 'bg-gray-500'}`}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-white" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-white" />
      <Handle type="target" position={Position.Right} className="w-3 h-3 !bg-white" />
      
      <div className="flex items-center gap-2 mb-1">
        <CheckSquare size={16} />
        <div className="font-semibold text-sm">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="text-xs opacity-90">Priority: {data.priority}</div>
      {data.due_date && (
        <div className="text-xs mt-1 opacity-90">Due: {new Date(data.due_date).toLocaleDateString()}</div>
      )}
    </div>
  );
};

const LiteratureNode = ({ data, selected }) => {
  return (
    <div 
      className={`px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-300 min-w-[200px] bg-purple-50 relative hover:shadow-2xl hover:scale-105 ${
        selected 
          ? 'border-purple-400 shadow-xl scale-105 ring-4 ring-purple-200' 
          : 'border-purple-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100'
      }`}
    >
      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-purple-500" />
      <Handle type="target" position={Position.Right} className="w-3 h-3 !bg-purple-500" />
      
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={16} className="text-purple-600" />
        <div className="font-semibold text-sm text-gray-800">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="ml-auto p-1 hover:bg-purple-200 rounded"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="text-xs text-gray-600">{data.authors}</div>
      <div className="text-xs text-purple-600 mt-1">{data.year}</div>
    </div>
  );
};

const nodeTypes = {
  topic: TopicNode,
  case: CaseNode,
  task: TaskNode,
  literature: LiteratureNode,
};

// Subpage Window Component
const SubpageWindow = ({ type, data, onClose, setMindMapData, loadMindMapData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [originalData, setOriginalData] = useState(data);

  useEffect(() => {
    setEditData(data);
    setOriginalData(data);
  }, [data]);

  const handleSave = async () => {
    try {
      const endpoint = type === 'literature' ? 'literature' : `${type}s`;
      const response = await axios.put(`${API}/${endpoint}/${data.id}`, editData);
      setIsEditing(false);
      setOriginalData(editData);
      
      // Update the mind map data and refresh nodes
      const updatedData = response.data;
      setMindMapData(prevData => {
        const newData = { ...prevData };
        if (type === 'literature') {
          newData.literature = newData.literature.map(item => 
            item.id === data.id ? updatedData : item
          );
        } else {
          const key = type + 's';
          newData[key] = newData[key].map(item => 
            item.id === data.id ? updatedData : item
          );
        }
        return newData;
      });
      
      // Refresh the visual nodes to reflect changes
      setTimeout(() => {
        loadMindMapData();
      }, 100);
      
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleCancel = () => {
    setEditData(originalData);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const endpoint = type === 'literature' ? 'literature' : `${type}s`;
        await axios.delete(`${API}/${endpoint}/${data.id}`);
        
        // Update mind map data
        setMindMapData(prevData => {
          const newData = { ...prevData };
          if (type === 'literature') {
            newData.literature = newData.literature.filter(item => item.id !== data.id);
          } else {
            const key = type + 's';
            newData[key] = newData[key].filter(item => item.id !== data.id);
          }
          return newData;
        });
        
        // Refresh the visual nodes
        setTimeout(() => {
          loadMindMapData();
        }, 100);
        
        // Close the subpage
        onClose();
        
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const endpoint = type === 'literature' ? 'literature' : `${type}s`;
        await axios.delete(`${API}/${endpoint}/${data.id}`);
        
        // Update mind map data
        setMindMapData(prevData => {
          const newData = { ...prevData };
          if (type === 'literature') {
            newData.literature = newData.literature.filter(item => item.id !== data.id);
          } else {
            const key = type + 's';
            newData[key] = newData[key].filter(item => item.id !== data.id);
          }
          return newData;
        });
        
        // Refresh the visual nodes
        setTimeout(() => {
          loadMindMapData();
        }, 100);
        
        // Close the subpage
        onClose();
        
      } catch (error) {
        console.error('Error deleting data:', error);
      }
    }
  };

  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  const renderEditableField = (label, field, type = 'text', options = {}) => {
    if (!editData) return null;
    
    if (isEditing) {
      if (type === 'textarea') {
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <textarea
              value={editData[field] || ''}
              onChange={(e) => setEditData({...editData, [field]: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={options.rows || 3}
            />
          </div>
        );
      } else if (type === 'select') {
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <select
              value={editData[field] || ''}
              onChange={(e) => setEditData({...editData, [field]: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {options.choices?.map(choice => (
                <option key={choice} value={choice}>{choice}</option>
              ))}
            </select>
          </div>
        );
      } else {
        return (
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <input
              type={type}
              value={editData[field] || ''}
              onChange={(e) => setEditData({...editData, [field]: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );
      }
    } else {
      return (
        <div>
          <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
          <p className="text-gray-600">{editData[field] || `No ${label.toLowerCase()} available.`}</p>
        </div>
      );
    }
  };

  const renderContent = () => {
    if (!editData) return <div>Loading...</div>;
    
    switch (type) {
      case 'topic':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: editData.color || '#3B82F6' }}
              ></div>
              {renderEditableField('Title', 'title')}
            </div>

            {renderEditableField('Description', 'description', 'textarea', { rows: 4 })}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Category', 'category')}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Flashcard Progress
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{editData.completed_flashcards || 0}/{editData.flashcard_count || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${editData.flashcard_count > 0 ? ((editData.completed_flashcards || 0) / editData.flashcard_count) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'literature':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <BookOpen className="text-purple-600" size={24} />
              {renderEditableField('Title', 'title')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Authors', 'authors')}
              {renderEditableField('Publication', 'publication')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Year', 'year', 'number')}
              {renderEditableField('DOI', 'doi')}
            </div>

            {renderEditableField('Abstract', 'abstract', 'textarea', { rows: 4 })}
            {renderEditableField('Notes', 'notes', 'textarea', { rows: 3 })}
          </div>
        );

      case 'case':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Users className="text-blue-600" size={24} />
              {renderEditableField('Case ID', 'case_id')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Primary Diagnosis', 'primary_diagnosis')}
              {renderEditableField('Age', 'age', 'number')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Gender', 'gender', 'select', { 
                choices: ['Male', 'Female', 'Non-binary', 'Other'] 
              })}
              {renderEditableField('Status', 'status', 'select', { 
                choices: ['active', 'archived', 'follow_up'] 
              })}
            </div>

            {renderEditableField('Chief Complaint', 'chief_complaint', 'textarea', { rows: 3 })}
            {renderEditableField('History of Present Illness', 'history_present_illness', 'textarea', { rows: 4 })}
            {renderEditableField('Mental Status Exam', 'mental_status_exam', 'textarea', { rows: 4 })}
            {renderEditableField('Assessment & Plan', 'assessment_plan', 'textarea', { rows: 4 })}
          </div>
        );

      case 'task':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <CheckSquare className="text-amber-600" size={24} />
              {renderEditableField('Title', 'title')}
            </div>

            {renderEditableField('Description', 'description', 'textarea', { rows: 3 })}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderEditableField('Status', 'status', 'select', { 
                choices: ['pending', 'in_progress', 'completed'] 
              })}
              
              {renderEditableField('Priority', 'priority', 'select', { 
                choices: ['low', 'medium', 'high'] 
              })}

              {renderEditableField('Due Date', 'due_date', 'date')}
            </div>
          </div>
        );

      default:
        return <div>Unknown node type</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">{type} Details</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
              >
                <Edit3 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
          {renderContent()}
        </div>

        {isEditing && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Node Selector Modal Component
const NodeSelector = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const nodeTypes = [
    { type: 'topic', label: 'Psychiatric Topic', icon: Brain, color: 'bg-blue-600', description: 'Add a new psychiatric topic or disorder' },
    { type: 'literature', label: 'Literature', icon: BookOpen, color: 'bg-purple-600', description: 'Add research papers, articles, or references' },
    { type: 'case', label: 'Patient Case', icon: Users, color: 'bg-indigo-600', description: 'Add a new patient case study' },
    { type: 'task', label: 'Task', icon: CheckSquare, color: 'bg-amber-600', description: 'Add a task or to-do item' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Add New Node</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          {nodeTypes.map(({ type, label, icon: Icon, color, description }) => (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <div className={`${color} p-2 rounded-lg text-white`}>
                <Icon size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-800">{label}</div>
                <div className="text-sm text-gray-500">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { fitView, setCenter, zoomTo, getViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mindMapData, setMindMapData] = useState({ topics: [], cases: [], tasks: [], literature: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [openSubpage, setOpenSubpage] = useState(null); // { type, data }
  const [subpageData, setSubpageData] = useState(null);

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Auto-save when nodes are moved
    const moveChanges = changes.filter(change => change.type === 'position' && change.dragging === false);
    if (moveChanges.length > 0) {
      // Auto-save positions after a short delay
      setTimeout(() => {
        console.log('Auto-saving node positions...');
        // Here you could make API calls to save positions if needed
      }, 500);
    }
  }, [onNodesChange]);

  useEffect(() => {
    loadMindMapData();
  }, []);

  useEffect(() => {
    // Refresh nodes when edit mode changes
    if (mindMapData.topics.length > 0) {
      convertDataToReactFlow(mindMapData);
    }
  }, [isEditing]);

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
  const deleteNode = async (nodeId, nodeType) => {
    try {
      await axios.delete(`${API}/${nodeType}s/${nodeId}`);
      setNodes((nds) => nds.filter(n => n.id !== `${nodeType}-${nodeId}`));
      setEdges((eds) => eds.filter(e => 
        !e.id.includes(`${nodeType}-${nodeId}`)
      ));
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  const arrangeNodesInCategory = (category) => {
    // Get current viewport information
    const viewport = getViewport();
    const { x, y, zoom } = viewport;
    
    // Calculate visible area based on current zoom and pan
    const viewportWidth = window.innerWidth - 320; // Subtract sidebar width
    const viewportHeight = window.innerHeight;
    
    // Convert screen coordinates to flow coordinates
    const visibleWidth = viewportWidth / zoom;
    const visibleHeight = viewportHeight / zoom;
    const centerX = -x / zoom;
    const centerY = -y / zoom;
    
    // Calculate arrangement area within visible bounds
    const padding = 50 / zoom; // Scale padding with zoom
    const arrangeWidth = visibleWidth - (padding * 2);
    
    const categoryNodeSpacing = Math.min(280, arrangeWidth / Math.max(1, nodes.filter(n => {
      switch(category) {
        case 'topics': return n.type === 'topic';
        case 'literature': return n.type === 'literature';
        case 'cases': return n.type === 'case';
        case 'tasks': return n.type === 'task';
        default: return false;
      }
    }).length));
    
    const baseY = centerY; // Use center of current view
    
    let arrangedNodes = [...nodes];
    let categoryNodes = [];
    
    // Filter nodes by category
    switch(category) {
      case 'topics':
        categoryNodes = arrangedNodes.filter(node => node.type === 'topic');
        break;
      case 'literature':
        categoryNodes = arrangedNodes.filter(node => node.type === 'literature');
        break;
      case 'cases':
        categoryNodes = arrangedNodes.filter(node => node.type === 'case');
        break;
      case 'tasks':
        categoryNodes = arrangedNodes.filter(node => node.type === 'task');
        break;
    }

    // Arrange selected category nodes horizontally within current view
    categoryNodes.forEach((node, index) => {
      const nodeIndex = arrangedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        const totalWidth = Math.max(0, (categoryNodes.length - 1) * categoryNodeSpacing);
        const startX = centerX - totalWidth / 2;
        
        arrangedNodes[nodeIndex] = {
          ...arrangedNodes[nodeIndex],
          position: {
            x: startX + (index * categoryNodeSpacing),
            y: baseY
          }
        };
      }
    });

    setNodes(arrangedNodes);
    setFocusedCategory(category);

    // Gently adjust view to ensure all nodes are visible
    if (categoryNodes.length > 0) {
      setTimeout(() => {
        const totalWidth = Math.max(0, (categoryNodes.length - 1) * categoryNodeSpacing);
        const bounds = {
          x: centerX - totalWidth / 2 - 100,
          y: baseY - 100,
          width: totalWidth + 200,
          height: 200
        };
        
        // Only adjust view if nodes would be outside current viewport
        const nodesFitInView = bounds.width <= visibleWidth && 
                              bounds.x >= centerX - visibleWidth/2 && 
                              bounds.x + bounds.width <= centerX + visibleWidth/2;
        
        if (!nodesFitInView) {
          fitView({ 
            padding: 0.1, 
            duration: 800,
            nodes: categoryNodes.map(node => ({ id: node.id }))
          });
        }
      }, 100);
    }
  };

  const resetToMindMapView = () => {
    // Restore original positions
    convertDataToReactFlow(mindMapData);
    setFocusedCategory(null);
    
    // Fit all nodes in view
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.1 });
    }, 100);
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
          originalData: topic,
          onDelete: isEditing ? () => deleteNode(topic.id, 'topic') : undefined
        }
      });
    });

    // Convert literature to nodes
    data.literature && data.literature.forEach(lit => {
      flowNodes.push({
        id: `literature-${lit.id}`,
        type: 'literature',
        position: lit.position,
        data: {
          label: lit.title,
          authors: lit.authors,
          year: lit.year,
          originalData: lit,
          onDelete: isEditing ? () => deleteNode(lit.id, 'literature') : undefined
        }
      });

      // Create edges from literature to linked topics
      lit.linked_topics.forEach(topicId => {
        flowEdges.push({
          id: `literature-${lit.id}-topic-${topicId}`,
          source: `topic-${topicId}`,
          target: `literature-${lit.id}`,
          type: 'smoothstep',
          style: { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '4,4' }
        });
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
          originalData: caseItem,
          onDelete: isEditing ? () => deleteNode(caseItem.id, 'case') : undefined
        }
      });

      // Create edges from topics to cases (hierarchy: Topic → Case)
      caseItem.linked_topics.forEach(topicId => {
        flowEdges.push({
          id: `topic-${topicId}-case-${caseItem.id}`,
          source: `topic-${topicId}`,
          target: `case-${caseItem.id}`,
          type: 'smoothstep',
          style: { stroke: '#3B82F6', strokeWidth: 3 }
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
          originalData: task,
          onDelete: isEditing ? () => deleteNode(task.id, 'task') : undefined
        }
      });

      // Create edges following hierarchy: Case → Task or Topic → Task
      if (task.linked_case_id) {
        flowEdges.push({
          id: `case-${task.linked_case_id}-task-${task.id}`,
          source: `case-${task.linked_case_id}`,
          target: `task-${task.id}`,
          type: 'smoothstep',
          style: { stroke: '#F59E0B', strokeWidth: 2 }
        });
      } else if (task.linked_topic_id) {
        flowEdges.push({
          id: `topic-${task.linked_topic_id}-task-${task.id}`,
          source: `topic-${task.linked_topic_id}`,
          target: `task-${task.id}`,
          type: 'smoothstep',
          style: { stroke: '#F59E0B', strokeWidth: 2 }
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onConnect = useCallback((params) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: { stroke: '#6B7280', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  };

  const onNodeDoubleClick = (event, node) => {
    console.log('Double-clicking node:', node);
    // Extract the node type and full ID
    const nodeType = node.id.split('-')[0];
    const nodeId = node.id.substring(nodeType.length + 1); // Get everything after the first hyphen
    console.log('Extracted nodeType:', nodeType, 'nodeId:', nodeId);
    
    // Open subpage instead of navigating
    setOpenSubpage({ type: nodeType, id: nodeId });
    loadSubpageData(nodeType, nodeId);
  };

  const loadSubpageData = async (nodeType, nodeId) => {
    try {
      console.log('Loading subpage data for:', nodeType, nodeId);
      const endpoint = nodeType === 'literature' ? 'literature' : `${nodeType}s`;
      console.log('API endpoint:', `${API}/${endpoint}/${nodeId}`);
      const response = await axios.get(`${API}/${endpoint}/${nodeId}`);
      setSubpageData(response.data);
    } catch (error) {
      console.error('Error loading subpage data:', error);
      setSubpageData(null);
    }
  };

  const closeSubpage = () => {
    setOpenSubpage(null);
    setSubpageData(null);
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

      console.log('Saving layout:', updates);
      setIsEditing(false);
      
      // Refresh data after a small delay to ensure state is updated
      setTimeout(() => {
        convertDataToReactFlow(mindMapData);
      }, 100);
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const addNewNode = async (nodeType) => {
    try {
      // Find a free position that doesn't overlap with existing nodes
      const findFreePosition = () => {
        const existingPositions = nodes.map(node => node.position);
        const gridSize = 300; // Spacing between potential positions
        
        // Try positions in a grid pattern
        for (let y = -200; y < 800; y += gridSize) {
          for (let x = -400; x < 1200; x += gridSize) {
            const testPosition = { x, y };
            const tooClose = existingPositions.some(pos => 
              Math.abs(pos.x - testPosition.x) < 250 && 
              Math.abs(pos.y - testPosition.y) < 150
            );
            
            if (!tooClose) {
              return testPosition;
            }
          }
        }
        
        // Fallback to a random position if no free grid position found
        return { 
          x: Math.random() * 600 - 300, 
          y: Math.random() * 400 - 200 
        };
      };

      const newPosition = findFreePosition();
      
      let newData = {};
      switch(nodeType) {
        case 'topic':
          newData = {
            title: 'New Topic',
            description: 'New topic description',
            category: 'New Category',
            color: '#3B82F6'
          };
          break;
        case 'case':
          newData = {
            case_id: `CASE-${Date.now()}`,
            encounter_date: new Date().toISOString(),
            primary_diagnosis: 'New Diagnosis',
            chief_complaint: 'New complaint',
            linked_topics: []
          };
          break;
        case 'task':
          newData = {
            title: 'New Task',
            description: 'New task description',
            priority: 'medium',
            status: 'pending'
          };
          break;
        case 'literature':
          newData = {
            title: 'New Literature',
            authors: 'New Author',
            publication: 'New Publication',
            year: new Date().getFullYear(),
            linked_topics: []
          };
          break;
      }

      // Set position
      newData.position = newPosition;

      const response = await axios.post(`${API}/${nodeType === 'literature' ? 'literature' : nodeType + 's'}`, newData);
      const newNodeData = response.data;
      
      // Add the new node to existing nodes without resetting positions
      const newNode = {
        id: `${nodeType}-${newNodeData.id}`,
        type: nodeType,
        position: newPosition,
        data: {
          label: nodeType === 'case' ? newNodeData.case_id : newNodeData.title,
          ...(nodeType === 'topic' && { 
            category: newNodeData.category, 
            color: newNodeData.color,
            flashcard_count: newNodeData.flashcard_count || 0,
            completed_flashcards: newNodeData.completed_flashcards || 0
          }),
          ...(nodeType === 'case' && { 
            diagnosis: newNodeData.primary_diagnosis,
            age: newNodeData.age
          }),
          ...(nodeType === 'task' && { 
            priority: newNodeData.priority,
            status: newNodeData.status,
            due_date: newNodeData.due_date
          }),
          ...(nodeType === 'literature' && { 
            authors: newNodeData.authors,
            year: newNodeData.year
          }),
          originalData: newNodeData,
          onDelete: isEditing ? () => deleteNode(newNodeData.id, nodeType) : undefined
        }
      };

      // Add to existing nodes array instead of reloading all data
      setNodes((nds) => [...nds, newNode]);
      
      // Update mindMapData state to include the new node
      setMindMapData(prevData => ({
        ...prevData,
        [nodeType === 'literature' ? 'literature' : nodeType + 's']: [
          ...prevData[nodeType === 'literature' ? 'literature' : nodeType + 's'],
          newNodeData
        ]
      }));
      
    } catch (error) {
      console.error('Error adding new node:', error);
    }
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
          <div 
            onClick={() => openSubpage ? closeSubpage() : arrangeNodesInCategory('topics')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'topics' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <Brain size={16} />
            Topics ({mindMapData.topics.length})
          </div>
          <div 
            onClick={() => openSubpage ? closeSubpage() : arrangeNodesInCategory('literature')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'literature' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <BookOpen size={16} />
            Literature ({mindMapData.literature?.length || 0})
          </div>
          <div 
            onClick={() => openSubpage ? closeSubpage() : arrangeNodesInCategory('cases')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'cases' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <Users size={16} />
            Cases ({mindMapData.cases.length})
          </div>
          <div 
            onClick={() => openSubpage ? closeSubpage() : arrangeNodesInCategory('tasks')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'tasks' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <CheckSquare size={16} />
            Tasks ({mindMapData.tasks.length})
          </div>
          
          {focusedCategory && !openSubpage && (
            <button
              onClick={resetToMindMapView}
              className="w-full bg-teal-600 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-teal-700 transition-colors cursor-pointer flex items-center gap-2 justify-center"
            >
              <Target size={16} />
              Reset View
            </button>
          )}
        </div>

        {/* Mind Map Controls */}
        <div className="mt-8 space-y-3">
          <div className="text-sm font-semibold text-slate-300 mb-3">Mind Map Controls</div>
          
          <button
            onClick={() => {
              const newEditMode = !isEditing;
              setIsEditing(newEditMode);
              // Refresh data to show/hide delete buttons
              convertDataToReactFlow(mindMapData);
            }}
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
                onClick={() => setShowNodeSelector(true)}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add New Node
              </button>

              <div className="text-xs text-slate-400 mt-4">
                <div className="mb-2">Hierarchy:</div>
                <div className="space-y-1">
                  <div>• Topics → Literature</div>
                  <div>• Topics → Cases</div>
                  <div>• Cases → Tasks</div>
                </div>
                <div className="mt-3 text-xs text-slate-300">
                  💡 Node positions auto-save when moved
                </div>
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

        {selectedNode && !openSubpage && (
          <div className="mt-8 p-4 bg-slate-700 bg-opacity-50 rounded-lg border border-teal-500">
            <h3 className="font-semibold mb-2 text-teal-300">Selected Node</h3>
            <p className="text-sm text-slate-300 capitalize">
              <span className="font-medium">{selectedNode.type}</span>: {selectedNode.data.label}
            </p>
            <button
              onClick={() => {
                const nodeType = selectedNode.id.split('-')[0];
                const nodeId = selectedNode.id.substring(nodeType.length + 1); // Get everything after the first hyphen
                console.log('Opening subpage from sidebar for:', nodeType, nodeId);
                setOpenSubpage({ type: nodeType, id: nodeId });
                loadSubpageData(nodeType, nodeId);
              }}
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
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true}
          nodesConnectable={isEditing}
          edgesReconnectable={isEditing}
          edgesFocusable={isEditing}
          elementsSelectable={true}
          className="bg-gradient-to-br from-slate-50 to-slate-100"
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#6B7280' },
            markerEnd: {
              type: 'arrowclosed',
              width: 15,
              height: 15,
              color: '#6B7280',
            }
          }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'topic': return node.data.color || '#3B82F6';
                case 'case': return '#6B7280';
                case 'task': return '#F59E0B';
                case 'literature': return '#8B5CF6';
                default: return '#9CA3AF';
              }
            }}
          />
          
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Instructions</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Click to select nodes</div>
              <div>• Double-click to view details</div>
              <div>• Hover and drag to reposition</div>
              <div>• {isEditing ? 'Connect nodes by dragging handles' : 'Edit mode: create connections'}</div>
              <div>• Zoom with mouse wheel</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Subpage Window */}
      {openSubpage && (
        <SubpageWindow 
          type={openSubpage.type}
          data={subpageData}
          onClose={closeSubpage}
          setMindMapData={setMindMapData}
          loadMindMapData={loadMindMapData}
        />
      )}

      {/* Node Selector Modal */}
      <NodeSelector
        isOpen={showNodeSelector}
        onClose={() => setShowNodeSelector(false)}
        onSelect={addNewNode}
      />
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <ReactFlowProvider>
        <Dashboard />
      </ReactFlowProvider>
    </Router>
  );
}

export default App;