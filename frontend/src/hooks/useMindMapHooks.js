import { useCallback, useRef } from 'react';
import { useMindMap } from '../context/MindMapContext';

// Custom hook for auto-save functionality
export const useAutoSave = (onSave, delay = 800) => {
  const timeoutRef = useRef(null);
  const { setSaveStatus, setLastSaved } = useMindMap();

  const triggerAutoSave = useCallback(async (data) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSaveStatus('saving');

    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(data);
        setSaveStatus('saved');
        setLastSaved(new Date().toISOString());
        
        // Reset status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, delay);
  }, [onSave, delay, setSaveStatus, setLastSaved]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setSaveStatus('idle');
    }
  }, [setSaveStatus]);

  return { triggerAutoSave, cancelAutoSave };
};

// Custom hook for node management
export const useNodeManagement = () => {
  const { mindMapData, addNode, updateNode, deleteNode, setSelectedNode } = useMindMap();

  const createNode = useCallback((type, data) => {
    const id = `${type}-${Date.now()}`;
    const nodeData = {
      id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    addNode(`${type}s`, nodeData);
    return nodeData;
  }, [addNode]);

  const editNode = useCallback((type, id, updates) => {
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    updateNode(`${type}s`, id, updatedData);
  }, [updateNode]);

  const removeNode = useCallback((type, id) => {
    deleteNode(`${type}s`, id);
    setSelectedNode(null);
  }, [deleteNode, setSelectedNode]);

  const getNodeById = useCallback((type, id) => {
    const collection = mindMapData[`${type}s`] || [];
    return collection.find(node => node.id === id);
  }, [mindMapData]);

  const getNodesByType = useCallback((type) => {
    return mindMapData[`${type}s`] || [];
  }, [mindMapData]);

  return {
    createNode,
    editNode,
    removeNode,
    getNodeById,
    getNodesByType
  };
};

// Custom hook for React Flow data conversion
export const useReactFlowData = () => {
  const { mindMapData } = useMindMap();

  const convertToReactFlowData = useCallback(() => {
    const nodes = [];
    const edges = [];

    // Convert topics
    mindMapData.topics?.forEach(topic => {
      nodes.push({
        id: topic.id,
        type: 'topic',
        position: topic.position || { x: 0, y: 0 },
        data: topic,
        selected: false
      });
    });

    // Convert cases
    mindMapData.cases?.forEach(caseItem => {
      nodes.push({
        id: caseItem.id,
        type: 'case',
        position: caseItem.position || { x: 0, y: 0 },
        data: caseItem,
        selected: false
      });
    });

    // Convert tasks
    mindMapData.tasks?.forEach(task => {
      nodes.push({
        id: task.id,
        type: 'task',
        position: task.position || { x: 0, y: 0 },
        data: task,
        selected: false
      });
    });

    // Convert literature
    mindMapData.literature?.forEach(lit => {
      nodes.push({
        id: lit.id,
        type: 'literature',
        position: lit.position || { x: 0, y: 0 },
        data: lit,
        selected: false
      });
    });

    // Convert connections to edges
    mindMapData.connections?.forEach(connection => {
      edges.push({
        id: connection.id || `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        label: connection.label,
        type: 'floating',
        style: {
          strokeWidth: 2,
          stroke: '#64748b'
        }
      });
    });

    return { nodes, edges };
  }, [mindMapData]);

  return { convertToReactFlowData };
};

export default {
  useAutoSave,
  useNodeManagement,
  useReactFlowData
};