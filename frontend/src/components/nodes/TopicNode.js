import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Brain, Tag, Clock, X } from 'lucide-react';

const TopicNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  const completionPercentage = data.flashcard_count > 0
    ? ((data.completed_flashcards || 0) / data.flashcard_count) * 100
    : 0;

  return (
    <div
      className={`group px-4 py-3 rounded-xl border-2 transition-all duration-700 min-w-[220px] relative hover:scale-105 backdrop-blur-sm ${selected
          ? 'border-teal-400 scale-105 ring-4 ring-teal-200 animate-pulse'
          : 'border-transparent hover:border-teal-300 hover:ring-2 hover:ring-teal-100'
        } ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'}`}
      style={{
        backgroundColor: data.color || '#3B82F6',
        color: 'white',
        boxShadow: selected
          ? `0 0 20px ${data.color || '#3B82F6'}40, 0 8px 32px rgba(0,0,0,0.3)`
          : `0 4px 20px ${data.color || '#3B82F6'}20, 0 4px 16px rgba(0,0,0,0.15)`,
        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease',
        filter: selected ? 'none' : `drop-shadow(0 4px 12px rgba(0,0,0,0.2))`
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

      {/* Priority indicator */}
      {data.priority && (
        <div className="absolute -top-2 -right-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${data.priority === 'high' ? 'bg-red-500' :
              data.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
            {data.priority === 'high' ? '!' : data.priority === 'medium' ? '•' : '✓'}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Brain size={16} className="drop-shadow-sm" />
          {data.tags && data.tags.length > 0 && (
            <Tag size={12} className="opacity-75" />
          )}
        </div>
        <div className="font-semibold text-sm truncate flex-1">{data.label}</div>
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
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="text-xs opacity-90 mb-2">{data.category}</div>

      {/* Enhanced progress display */}
      {data.flashcard_count > 0 && (
        <div className="text-xs mt-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="opacity-90">{data.completed_flashcards}/{data.flashcard_count} flashcards</span>
            <span className="font-semibold">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags display */}
      {(() => {
        // Handle tags as either string (comma-separated) or array
        let tagsArray = [];
        if (data.tags) {
          if (typeof data.tags === 'string') {
            tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
          } else if (Array.isArray(data.tags)) {
            tagsArray = data.tags;
          }
        }
        
        return tagsArray.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tagsArray.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
            {tagsArray.length > 3 && (
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                +{tagsArray.length - 3}
              </span>
            )}
          </div>
        );
      })()
        </div>
      )}

      {/* Last updated indicator */}
      {data.updated_at && (
        <div className="absolute bottom-1 right-1 opacity-50">
          <Clock size={10} />
        </div>
      )}
    </div>
  );
};

export default TopicNode;