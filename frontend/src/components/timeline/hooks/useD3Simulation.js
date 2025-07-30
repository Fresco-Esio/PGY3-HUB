// D3 Simulation Hook - Extracted logic for force-directed graph simulation
import { useState, useRef, useEffect, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';

export const useD3Simulation = (initialData = [], dimensions = { width: 800, height: 600 }) => {
  const [simulationData, setSimulationData] = useState(initialData);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const simulationRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);

  // Initialize simulation
  const initializeSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = forceSimulation()
      .force('link', forceLink().id(d => d.id).distance(80))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .velocityDecay(0.7)
      .alphaDecay(0.02);

    simulationRef.current = simulation;
    return simulation;
  }, [dimensions.width, dimensions.height]);

  // Update simulation with new data
  const updateSimulation = useCallback((nodes, links = []) => {
    if (!simulationRef.current) {
      initializeSimulation();
    }

    const simulation = simulationRef.current;
    
    // Deep clone to avoid mutation
    const nodesCopy = nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * dimensions.width,
      y: node.y || Math.random() * dimensions.height
    }));

    nodesRef.current = nodesCopy;
    linksRef.current = links;

    simulation
      .nodes(nodesCopy)
      .force('link').links(links);

    setIsSimulationRunning(true);

    simulation.on('tick', () => {
      setSimulationData([...nodesCopy]);
    });

    simulation.on('end', () => {
      setIsSimulationRunning(false);
    });

    simulation.restart();
  }, [dimensions.width, dimensions.height, initializeSimulation]);

  // Pin/unpin nodes
  const pinNode = useCallback((nodeId, x, y) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) {
      node.fx = x;
      node.fy = y;
      if (simulationRef.current) {
        simulationRef.current.restart();
      }
    }
  }, []);

  const unpinNode = useCallback((nodeId) => {
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (node) {
      node.fx = null;
      node.fy = null;
      if (simulationRef.current) {
        simulationRef.current.restart();
      }
    }
  }, []);

  // Drag behavior
  const createDragBehavior = useCallback((onNodeUpdate) => {
    return drag()
      .on('start', (event, d) => {
        if (!event.active) {
          simulationRef.current?.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
        setIsSimulationRunning(true);
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) {
          simulationRef.current?.alphaTarget(0);
        }
        if (onNodeUpdate) {
          onNodeUpdate(d.id, { x: d.x, y: d.y });
        }
        setIsSimulationRunning(false);
      });
  }, []);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      setIsSimulationRunning(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return {
    simulationData,
    isSimulationRunning,
    updateSimulation,
    pinNode,
    unpinNode,
    createDragBehavior,
    stopSimulation,
    simulation: simulationRef.current
  };
};