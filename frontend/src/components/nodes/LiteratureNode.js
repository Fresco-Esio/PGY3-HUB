import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { BookOpen, X } from 'lucide-react';

const LiteratureNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation with the longest delay for final polish - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 250);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-650 min-w-[200px] bg-purple-50 relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-purple-400 shadow-xl scale-105 ring-4 ring-purple-200'
          : 'border-purple-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100'
        } ${isVisible ? 'opacity-100 scale-100 translate-x-0 rotate-0' : 'opacity-0 scale-95 translate-x-4 -rotate-1'}`}
      style={{
        transition: 'all 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s ease'
      }}
    >
      {/* Connection Hotspots - Stacked source and target handles for all four sides */}
      {/* Top handles */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
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
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      <div 
        className="flex items-center gap-2 mb-1 cursor-pointer"
        onClick={(e) => {
          // Don't stop propagation immediately - delay the action to allow double-clicks
          e.preventDefault(); // Prevent any default behavior but allow bubbling
          
          // Use a longer timeout to distinguish between single click and double-click
          const clickTimeout = setTimeout(() => {
            // Only execute click if this wasn't part of a double-click sequence
            e.stopPropagation(); // Stop propagation only when actually handling the click
            if (data.onLiteratureClick) {
              data.onLiteratureClick(data);
            }
          }, 300); // Increased timeout
          
          // Store timeout ID on the element to cancel it if double-click occurs
          e.currentTarget.clickTimeout = clickTimeout;
        }}
        onDoubleClick={(e) => {
          // Cancel the pending click action
          if (e.currentTarget.clickTimeout) {
            clearTimeout(e.currentTarget.clickTimeout);
            e.currentTarget.clickTimeout = null;
          }
          
          // Don't prevent default - allow the double-click to bubble up for modal opening
          // The parent node will handle the double-click to open the modal
        }}
      >
        <BookOpen size={16} className="text-purple-600" />
        <div className="font-semibold text-sm text-gray-800">{data.label}</div>
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
            className="ml-auto p-1 hover:bg-purple-200 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
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

export default LiteratureNode;