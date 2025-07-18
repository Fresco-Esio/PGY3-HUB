import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  useReactFlow,
  Background,
  Controls
} from '@xyflow/react';
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 50, y: 50 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 400, y: 50 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 250, y: 300 }, data: { label: 'Node 3' } },
];
const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e1-3', source: '1', target: '3' },
];

function ForceLayout() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onLayout = useCallback(() => {
    const nodesCopy = JSON.parse(JSON.stringify(nodes));
    const edgesCopy = JSON.parse(JSON.stringify(edges));

    const simulation = forceSimulation(nodesCopy)
      .force('link', forceLink(edgesCopy).id(d => d.id).distance(150))
      .force('charge', forceManyBody().strength(-350))
      .force('center', forceCenter(400, 200))
      .stop();

    simulation.tick(300);

    const layoutedNodes = simulation.nodes();
    const positionMap = new Map(layoutedNodes.map(n => [n.id, { x: n.x, y: n.y }]));

    setNodes(prevNodes =>
      prevNodes.map(node => ({
        ...node,
        position: positionMap.get(node.id) || node.position,
      }))
    );

    window.requestAnimationFrame(() => fitView({ duration: 600 }));

  }, [nodes, edges, setNodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Panel position="top-left">
        <button onClick={onLayout}>Run Force Layout</button>
      </Panel>
      <Background />
      <Controls />
    </ReactFlow>
  );
}

export default function LayoutTest() {
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <ReactFlowProvider>
        <ForceLayout />
      </ReactFlowProvider>
    </div>
  );
}