import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Initial state for the mind map
const initialState = {
  mindMapData: {
    topics: [],
    cases: [],
    tasks: [],
    literature: [],
    connections: []
  },
  isLoading: false,
  lastSaved: null,
  saveStatus: 'idle', // idle, saving, saved, error
  selectedNodeId: null,
  editMode: false
};

// Action types
const ActionTypes = {
  SET_MINDMAP_DATA: 'SET_MINDMAP_DATA',
  UPDATE_MINDMAP_DATA: 'UPDATE_MINDMAP_DATA',
  SET_LOADING: 'SET_LOADING',
  SET_SAVE_STATUS: 'SET_SAVE_STATUS',
  SET_LAST_SAVED: 'SET_LAST_SAVED',
  SET_SELECTED_NODE: 'SET_SELECTED_NODE',
  SET_EDIT_MODE: 'SET_EDIT_MODE',
  ADD_NODE: 'ADD_NODE',
  UPDATE_NODE: 'UPDATE_NODE',
  DELETE_NODE: 'DELETE_NODE',
  ADD_CONNECTION: 'ADD_CONNECTION',
  DELETE_CONNECTION: 'DELETE_CONNECTION'
};

// Reducer function
const mindMapReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_MINDMAP_DATA:
      return {
        ...state,
        mindMapData: action.payload,
        isLoading: false
      };
    
    case ActionTypes.UPDATE_MINDMAP_DATA:
      return {
        ...state,
        mindMapData: {
          ...state.mindMapData,
          ...action.payload
        }
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case ActionTypes.SET_SAVE_STATUS:
      return {
        ...state,
        saveStatus: action.payload
      };

    case ActionTypes.SET_LAST_SAVED:
      return {
        ...state,
        lastSaved: action.payload
      };

    case ActionTypes.SET_SELECTED_NODE:
      return {
        ...state,
        selectedNodeId: action.payload
      };

    case ActionTypes.SET_EDIT_MODE:
      return {
        ...state,
        editMode: action.payload
      };

    case ActionTypes.ADD_NODE:
      const { nodeType, nodeData } = action.payload;
      return {
        ...state,
        mindMapData: {
          ...state.mindMapData,
          [nodeType]: [...state.mindMapData[nodeType], nodeData]
        }
      };

    case ActionTypes.UPDATE_NODE:
      const { type, id, data } = action.payload;
      return {
        ...state,
        mindMapData: {
          ...state.mindMapData,
          [type]: state.mindMapData[type].map(node => 
            node.id === id ? { ...node, ...data } : node
          )
        }
      };

    case ActionTypes.DELETE_NODE:
      const { nodeType: deleteType, nodeId } = action.payload;
      return {
        ...state,
        mindMapData: {
          ...state.mindMapData,
          [deleteType]: state.mindMapData[deleteType].filter(node => node.id !== nodeId),
          // Also remove connections involving this node
          connections: state.mindMapData.connections.filter(conn => 
            conn.source !== nodeId && conn.target !== nodeId
          )
        }
      };

    case ActionTypes.ADD_CONNECTION:
      return {
        ...state,
        mindMapData: {
          ...state.mindMapData,
          connections: [...state.mindMapData.connections, action.payload]
        }
      };

    case ActionTypes.DELETE_CONNECTION:
      return {
        ...state,
        mindMapData: {
          ...state.mindMapData,
          connections: state.mindMapData.connections.filter(conn => conn.id !== action.payload)
        }
      };

    default:
      return state;
  }
};

// Create the context
const MindMapContext = createContext(null);

// Custom hook to use the context
export const useMindMap = () => {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  return context;
};

// Provider component
export const MindMapProvider = ({ children }) => {
  const [state, dispatch] = useReducer(mindMapReducer, initialState);

  // Action creators
  const actions = {
    setMindMapData: useCallback((data) => {
      dispatch({ type: ActionTypes.SET_MINDMAP_DATA, payload: data });
    }, []),

    updateMindMapData: useCallback((data) => {
      dispatch({ type: ActionTypes.UPDATE_MINDMAP_DATA, payload: data });
    }, []),

    setLoading: useCallback((loading) => {
      dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    }, []),

    setSaveStatus: useCallback((status) => {
      dispatch({ type: ActionTypes.SET_SAVE_STATUS, payload: status });
    }, []),

    setLastSaved: useCallback((timestamp) => {
      dispatch({ type: ActionTypes.SET_LAST_SAVED, payload: timestamp });
    }, []),

    setSelectedNode: useCallback((nodeId) => {
      dispatch({ type: ActionTypes.SET_SELECTED_NODE, payload: nodeId });
    }, []),

    setEditMode: useCallback((editMode) => {
      dispatch({ type: ActionTypes.SET_EDIT_MODE, payload: editMode });
    }, []),

    addNode: useCallback((nodeType, nodeData) => {
      dispatch({ type: ActionTypes.ADD_NODE, payload: { nodeType, nodeData } });
    }, []),

    updateNode: useCallback((type, id, data) => {
      dispatch({ type: ActionTypes.UPDATE_NODE, payload: { type, id, data } });
    }, []),

    deleteNode: useCallback((nodeType, nodeId) => {
      dispatch({ type: ActionTypes.DELETE_NODE, payload: { nodeType, nodeId } });
    }, []),

    addConnection: useCallback((connection) => {
      dispatch({ type: ActionTypes.ADD_CONNECTION, payload: connection });
    }, []),

    deleteConnection: useCallback((connectionId) => {
      dispatch({ type: ActionTypes.DELETE_CONNECTION, payload: connectionId });
    }, [])
  };

  // Provide both state and actions
  const value = {
    ...state,
    ...actions
  };

  return (
    <MindMapContext.Provider value={value}>
      {children}
    </MindMapContext.Provider>
  );
};

export default MindMapContext;