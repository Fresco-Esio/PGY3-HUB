import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Mind Map Node Component
const MindMapNode = ({ node, nodeType, onClick, position = { x: 0, y: 0 } }) => {
  const getNodeStyle = () => {
    const baseStyle = {
      position: 'absolute',
      left: `${position.x + 400}px`, // Center offset
      top: `${position.y + 300}px`,
      cursor: 'pointer',
      borderRadius: '12px',
      padding: '16px',
      minWidth: '200px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
      transform: 'scale(1)',
    };

    switch (nodeType) {
      case 'topic':
        return {
          ...baseStyle,
          backgroundColor: node.color || '#3B82F6',
          color: 'white',
          border: `2px solid ${node.color || '#3B82F6'}`,
        };
      case 'case':
        return {
          ...baseStyle,
          backgroundColor: 'white',
          color: '#1F2937',
          border: '2px solid #E5E7EB',
        };
      case 'task':
        return {
          ...baseStyle,
          backgroundColor: node.status === 'completed' ? '#10B981' : '#F59E0B',
          color: 'white',
        };
      default:
        return baseStyle;
    }
  };

  const handleMouseEnter = (e) => {
    e.target.style.transform = 'scale(1.05)';
    e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
  };

  const handleMouseLeave = (e) => {
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  };

  return (
    <div
      style={getNodeStyle()}
      onClick={() => onClick(node, nodeType)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="font-semibold text-sm mb-2">
        {nodeType === 'topic' && node.title}
        {nodeType === 'case' && `Case: ${node.case_id}`}
        {nodeType === 'task' && node.title}
      </div>
      <div className="text-xs opacity-80">
        {nodeType === 'topic' && node.category}
        {nodeType === 'case' && node.primary_diagnosis}
        {nodeType === 'task' && `Priority: ${node.priority}`}
      </div>
      {nodeType === 'topic' && (
        <div className="mt-2 text-xs">
          Flashcards: {node.completed_flashcards}/{node.flashcard_count}
        </div>
      )}
    </div>
  );
};

// Connection Line Component
const ConnectionLine = ({ from, to, color = '#9CA3AF' }) => {
  const fromX = from.x + 400 + 100; // Adjust for node center
  const fromY = from.y + 300 + 40;
  const toX = to.x + 400 + 100;
  const toY = to.y + 300 + 40;

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <defs>
        <pattern
          id="dots"
          patternUnits="userSpaceOnUse"
          width="4"
          height="4"
        >
          <circle cx="2" cy="2" r="1" fill={color} opacity="0.6" />
        </pattern>
      </defs>
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke="url(#dots)"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
    </svg>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const [mindMapData, setMindMapData] = useState({ topics: [], cases: [], tasks: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMindMapData();
  }, []);

  const loadMindMapData = async () => {
    try {
      const response = await axios.get(`${API}/mindmap-data`);
      setMindMapData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading mind map data:', error);
      setLoading(false);
    }
  };

  const initSampleData = async () => {
    try {
      await axios.post(`${API}/init-sample-data`);
      loadMindMapData();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  };

  const handleNodeClick = (node, nodeType) => {
    console.log('Node clicked:', nodeType, node);
    setSelectedNode(node);
    setSelectedNodeType(nodeType);
  };

  const renderConnections = () => {
    const connections = [];
    
    // Connect cases to their linked topics
    mindMapData.cases.forEach(caseNode => {
      caseNode.linked_topics.forEach(topicId => {
        const topic = mindMapData.topics.find(t => t.id === topicId);
        if (topic) {
          connections.push(
            <ConnectionLine
              key={`case-${caseNode.id}-topic-${topic.id}`}
              from={caseNode.position}
              to={topic.position}
              color="#6B7280"
            />
          );
        }
      });
    });

    // Connect tasks to their linked entities
    mindMapData.tasks.forEach(task => {
      if (task.linked_topic_id) {
        const topic = mindMapData.topics.find(t => t.id === task.linked_topic_id);
        if (topic) {
          connections.push(
            <ConnectionLine
              key={`task-${task.id}-topic-${topic.id}`}
              from={task.position}
              to={topic.position}
              color="#F59E0B"
            />
          );
        }
      }
      if (task.linked_case_id) {
        const caseNode = mindMapData.cases.find(c => c.id === task.linked_case_id);
        if (caseNode) {
          connections.push(
            <ConnectionLine
              key={`task-${task.id}-case-${caseNode.id}`}
              from={task.position}
              to={caseNode.position}
              color="#F59E0B"
            />
          );
        }
      }
    });

    return connections;
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
      {/* Left Sidebar - The "Vault Door" */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl">
        <div className="mb-8">
          <div className="text-3xl font-thin tracking-wide text-white mb-1">PGY-3</div>
          <div className="text-3xl font-bold tracking-wide text-white">HQ</div>
          <div className="text-sm text-slate-300 mt-2">Psychiatry Resident Dashboard</div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer">
            <span className="mr-2">📚</span>
            Psychiatric Topics ({mindMapData.topics.length})
          </div>
          <div className="bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer">
            <span className="mr-2">👥</span>
            Patient Cases ({mindMapData.cases.length})
          </div>
          <div className="bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer">
            <span className="mr-2">✅</span>
            Tasks ({mindMapData.tasks.length})
          </div>
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
          <div className="mt-8 p-4 bg-slate-700 bg-opacity-50 rounded-lg">
            <h3 className="font-semibold mb-2">Selected Node</h3>
            <p className="text-sm text-slate-300">
              {selectedNodeType}: {selectedNode.title || selectedNode.case_id}
            </p>
          </div>
        )}
      </div>

      {/* Main Workspace - The Mind Map */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>
          
          {/* Render connections first (behind nodes) */}
          {renderConnections()}

          {/* Render all nodes */}
          {mindMapData.topics.map(topic => (
            <MindMapNode
              key={topic.id}
              node={topic}
              nodeType="topic"
              position={topic.position}
              onClick={handleNodeClick}
            />
          ))}

          {mindMapData.cases.map(caseNode => (
            <MindMapNode
              key={caseNode.id}
              node={caseNode}
              nodeType="case"
              position={caseNode.position}
              onClick={handleNodeClick}
            />
          ))}

          {mindMapData.tasks.map(task => (
            <MindMapNode
              key={task.id}
              node={task}
              nodeType="task"
              position={task.position}
              onClick={handleNodeClick}
            />
          ))}

          {/* Center point indicator */}
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-slate-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-30"></div>
        </div>

        {/* Empty state message */}
        {mindMapData.topics.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-2xl font-light mb-2">Your Mind Map Awaits</h2>
              <p className="text-gray-400">Initialize sample data to see the interconnected dashboard</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;