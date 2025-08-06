import React, { forwardRef } from 'react';

const TimelineNode = forwardRef(({ 
  node, 
  position, 
  isHovered, 
  isSelected,
  onMouseEnter,
  onMouseLeave,
  onClick 
}, ref) => {
  const getNodeColor = (type) => {
    switch (type) {
      case 'patient':
        return 'bg-blue-500 border-blue-600';
      case 'clinical':
        return 'bg-green-500 border-green-600';
      case 'therapy':
        return 'bg-purple-500 border-purple-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'patient':
        return '👤';
      case 'clinical':
        return '🏥';
      case 'therapy':
        return '💭';
      default:
        return '📋';
    }
  };

  return (
    <div
      ref={ref}
      className={`absolute cursor-pointer select-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
        isHovered || isSelected ? 'z-10' : 'z-5'
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Main node circle */}
      <div
        className={`
          w-16 h-16 rounded-full border-4 flex items-center justify-center text-white text-xl font-bold shadow-lg
          ${getNodeColor(node.type)}
          ${isHovered ? 'shadow-xl ring-4 ring-opacity-50 ring-blue-300' : ''}
          ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
        `}
      >
        <span className="text-2xl">{getNodeIcon(node.type)}</span>
      </div>

      {/* Node label */}
      <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-xs font-semibold text-gray-700 whitespace-nowrap px-2 py-1 bg-white rounded shadow">
          {node.title}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {new Date(node.date).toLocaleDateString()}
        </div>
      </div>

      {/* Connection points for dragging */}
      <div className="absolute inset-0 w-16 h-16">
        {/* Left connection point */}
        <div className="absolute left-0 top-1/2 w-2 h-2 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity" />
        
        {/* Right connection point */}
        <div className="absolute right-0 top-1/2 w-2 h-2 bg-gray-400 rounded-full transform translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity" />
        
        {/* Top connection point */}
        <div className="absolute top-0 left-1/2 w-2 h-2 bg-gray-400 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity" />
        
        {/* Bottom connection point */}
        <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-gray-400 rounded-full transform -translate-x-1/2 translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});

TimelineNode.displayName = 'TimelineNode';

export { TimelineNode };
