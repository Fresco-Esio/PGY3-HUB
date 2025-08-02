import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Users, Calendar, CheckSquare, Clock, X, AlertCircle } from 'lucide-react';

const CaseNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation with slight delay for staggered effect - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyLevel = (data) => {
    // Simple urgency calculation based on keywords
    const urgentKeywords = ['emergency', 'urgent', 'crisis', 'acute', 'severe'];
    const complaint = data.chief_complaint?.toLowerCase() || '';
    const diagnosis = data.diagnosis?.toLowerCase() || '';

    if (urgentKeywords.some(keyword => complaint.includes(keyword) || diagnosis.includes(keyword))) {
      return 'high';
    }
    return 'normal';
  };

  const urgency = getUrgencyLevel(data);

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-600 min-w-[220px] bg-white relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-blue-400 shadow-xl scale-105 ring-4 ring-blue-200'
          : 'border-gray-200 hover:border-blue-300 hover:ring-2 hover:ring-blue-100'
        } ${urgency === 'high' ? 'ring-2 ring-red-300' : ''} ${isVisible ? 'opacity-100 scale-100 translate-y-0 rotate-0' : 'opacity-0 scale-90 translate-y-6 rotate-1'}`}
      style={{
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s ease'
      }}
    >
      {/* Connection Hotspots - Stacked source and target handles for all four sides */}
      {/* Top handles */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Right handles */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Bottom handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Left handles */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Urgency indicator */}
      {urgency === 'high' && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            <AlertCircle size={14} className="text-white" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Users size={16} className="text-blue-600" />
          {data.linked_topics && data.linked_topics.length > 0 && (
            <div className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
              {data.linked_topics.length}
            </div>
          )}
        </div>
        <div className="font-semibold text-sm text-gray-800 truncate flex-1">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              // Don't stop propagation immediately - delay the action to allow double-clicks
              e.preventDefault(); // Prevent any default behavior but allow bubbling
              
              // Use a longer timeout to distinguish between single click and double-click
              const deleteTimeout = setTimeout(() => {
                // Only execute delete if this wasn't part of a double-click sequence
                e.stopPropagation(); // Stop propagation only when actually deleting
                data.onDelete();
              }, 300); // Increased timeout
              
              // Store timeout ID on the button to cancel it if double-click occurs
              e.currentTarget.deleteTimeout = deleteTimeout;
            }}
            onDoubleClick={(e) => {
              // Cancel the pending delete action
              if (e.currentTarget.deleteTimeout) {
                clearTimeout(e.currentTarget.deleteTimeout);
                e.currentTarget.deleteTimeout = null;
              }
              
              // Don't prevent default - allow the double-click to bubble up for modal opening
              // The parent node will handle the double-click to open the modal
            }}
            className="ml-auto p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 mb-2 truncate">{data.diagnosis}</div>

      {/* Enhanced patient info */}
      <div className="space-y-1">
        {data.age && (
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <Calendar size={10} />
            Age: {data.age}
          </div>
        )}

        {/* Status badge */}
        {data.status && (
          <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getStatusColor(data.status)}`}>
            {data.status}
          </span>
        )}
      </div>

      {/* Progress indicators */}
      {data.tasks_count && data.tasks_count > 0 && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <CheckSquare size={10} />
          {data.completed_tasks || 0}/{data.tasks_count} tasks
        </div>
      )}

      {/* Last updated indicator */}
      {data.updated_at && (
        <div className="absolute bottom-1 right-1 opacity-30">
          <Clock size={10} />
        </div>
      )}
    </div>
  );
};

export default CaseNode;