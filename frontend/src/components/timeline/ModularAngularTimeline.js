// Modular Angular Timeline - Refactored timeline using extracted components and hooks
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw } from 'lucide-react';

// Import our modular components and hooks
import { useD3Simulation } from './hooks/useD3Simulation';
import { useCanvasRenderer } from './hooks/useCanvasRenderer';
import { useTimelineData } from './hooks/useTimelineData';
import { PatientCard, ClinicianCard } from './components/HoverCards';
import TimelineNode from './components/TimelineNode';
import { 
  calculateZigzagPositions, 
  calculateCardPosition,
  debounce,
  throttle 
} from './utils/timelineUtils';

const ModularAngularTimeline = ({ 
  caseId, 
  initialEntries = [],
  onEntryUpdate,
  onEntryAdd,
  onEntryDelete,
  className = '',
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize our custom hooks
  const {
    entries,
    sortedEntries,
    selectedEntry,
    editingEntry,
    setSelectedEntry,
    setEditingEntry,
    addEntry,
    updateEntry,
    deleteEntry,
    insertEntry
  } = useTimelineData(initialEntries);

  const { render, getNodeAtPosition, clearCanvas } = useCanvasRenderer(
    canvasRef,
    { width, height }
  );

  const {
    simulationData,
    updateSimulation,
    pinNode,
    unpinNode,
    createDragBehavior
  } = useD3Simulation([], { width, height });

  // Calculate timeline positions
  const timelinePositions = React.useMemo(() => {
    return calculateZigzagPositions(sortedEntries, width, height);
  }, [sortedEntries, width, height]);

  // Update D3 simulation when positions change
  useEffect(() => {
    if (timelinePositions.length > 0) {
      updateSimulation(timelinePositions);
    }
  }, [timelinePositions, updateSimulation]);

  // Render timeline on canvas
  useEffect(() => {
    if (simulationData.length > 0) {
      render(simulationData, [], hoveredNode, selectedEntry, true);
    }
  }, [simulationData, hoveredNode, selectedEntry, render]);

  // Handle mouse move for hover detection
  const handleMouseMove = useCallback(
    throttle((e) => {
      if (!canvasRef.current || isPanning) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x: e.clientX, y: e.clientY });

      const nodeAtPosition = getNodeAtPosition(x, y, simulationData);
      setHoveredNode(nodeAtPosition?.id || null);
    }, 16), // ~60 FPS
    [simulationData, isPanning, getNodeAtPosition]
  );

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // Handle node click
  const handleNodeClick = useCallback((nodeId) => {
    setSelectedEntry(selectedEntry === nodeId ? null : nodeId);
  }, [selectedEntry, setSelectedEntry]);

  // Handle node edit
  const handleNodeEdit = useCallback((nodeId) => {
    setEditingEntry(nodeId);
    // You could open a modal or inline editor here
    if (onEntryUpdate) {
      onEntryUpdate(nodeId, 'edit');
    }
  }, [setEditingEntry, onEntryUpdate]);

  // Handle node delete
  const handleNodeDelete = useCallback((nodeId) => {
    deleteEntry(nodeId);
    if (onEntryDelete) {
      onEntryDelete(nodeId);
    }
  }, [deleteEntry, onEntryDelete]);

  // Handle node pin/unpin
  const handleNodePin = useCallback((nodeId, x, y) => {
    pinNode(nodeId, x, y);
  }, [pinNode]);

  const handleNodeUnpin = useCallback((nodeId) => {
    unpinNode(nodeId);
  }, [unpinNode]);

  // Add new entry
  const handleAddEntry = useCallback(() => {
    const newEntry = addEntry({
      title: `Entry ${entries.length + 1}`,
      patient_narrative: '',
      clinical_notes: '',
      timestamp: new Date().toISOString()
    });

    if (onEntryAdd) {
      onEntryAdd(newEntry);
    }
  }, [addEntry, entries.length, onEntryAdd]);

  // Reset timeline layout
  const handleReset = useCallback(() => {
    // Reset all pinned nodes
    simulationData.forEach(node => {
      if (node.fx !== undefined || node.fy !== undefined) {
        unpinNode(node.id);
      }
    });
    
    // Restart simulation
    updateSimulation(timelinePositions);
  }, [simulationData, unpinNode, updateSimulation, timelinePositions]);

  return (
    <div className={`relative ${className}`}>
      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="relative border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50"
        style={{ width, height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          style={{ width: `${width}px`, height: `${height}px` }}
        />

        {/* Interactive Node Overlays */}
        <AnimatePresence>
          {simulationData.map((node) => (
            <TimelineNode
              key={node.id}
              node={node}
              isSelected={selectedEntry === node.id}
              isHovered={hoveredNode === node.id}
              isPinned={node.fx !== undefined}
              onSelect={handleNodeClick}
              onEdit={handleNodeEdit}
              onDelete={handleNodeDelete}
              onPin={handleNodePin}
              onUnpin={handleNodeUnpin}
              canvasRef={canvasRef}
            />
          ))}
        </AnimatePresence>

        {/* Hover Cards */}
        <AnimatePresence>
          {hoveredNode && simulationData.map((node) => {
            if (node.id !== hoveredNode) return null;
            
            const patientPosition = calculateCardPosition(node, 'patient');
            const clinicianPosition = calculateCardPosition(node, 'clinical');
            
            return (
              <React.Fragment key={`cards-${node.id}`}>
                <PatientCard
                  entry={node.data}
                  position={patientPosition}
                  isVisible={true}
                  onEdit={handleNodeEdit}
                  isLoading={isLoading}
                />
                <ClinicianCard
                  entry={node.data}
                  position={clinicianPosition}
                  isVisible={true}
                  onEdit={handleNodeEdit}
                  isLoading={isLoading}
                />
              </React.Fragment>
            );
          })}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
            <div className="text-white text-sm">Loading timeline data...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddEntry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Entry
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw size={16} />
            Reset Layout
          </motion.button>
        </div>

        <div className="text-xs text-slate-400">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          {selectedEntry && ' • 1 selected'}
        </div>
      </div>
    </div>
  );
};

// For backward compatibility, export with original name
const AngularTimeline = ModularAngularTimeline;
AngularTimeline.displayName = 'AngularTimeline';

export default AngularTimeline;