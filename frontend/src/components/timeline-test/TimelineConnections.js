import React from 'react';

const TimelineConnections = ({ data, positions, width, height }) => {
  // Generate connection paths between consecutive nodes
  const generateConnections = () => {
    const connections = [];
    
    for (let i = 0; i < data.length - 1; i++) {
      const currentNode = data[i];
      const nextNode = data[i + 1];
      const currentPos = positions[currentNode.id];
      const nextPos = positions[nextNode.id];
      
      if (currentPos && nextPos) {
        connections.push({
          id: `connection-${currentNode.id}-${nextNode.id}`,
          start: currentPos,
          end: nextPos,
          type: 'progression'
        });
      }
    }
    
    return connections;
  };

  // Create curved path between two points
  const createCurvedPath = (start, end) => {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    // Add some curve based on the vertical distance
    const curvature = Math.abs(end.y - start.y) * 0.5;
    const controlY = midY - curvature;
    
    return `M ${start.x} ${start.y} Q ${midX} ${controlY} ${end.x} ${end.y}`;
  };

  // Create straight path with slight curve
  const createSmoothPath = (start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Control points for smooth curve
    const cp1x = start.x + dx * 0.3;
    const cp1y = start.y;
    const cp2x = end.x - dx * 0.3;
    const cp2y = end.y;
    
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
  };

  const connections = generateConnections();

  if (connections.length === 0) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none z-0"
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Gradient for connection lines */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
        </linearGradient>
        
        {/* Arrow marker for direction */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#6B7280"
            opacity="0.7"
          />
        </marker>
        
        {/* Dot marker for connection points */}
        <marker
          id="dot"
          markerWidth="6"
          markerHeight="6"
          refX="3"
          refY="3"
        >
          <circle
            cx="3"
            cy="3"
            r="2"
            fill="#6B7280"
            opacity="0.5"
          />
        </marker>
      </defs>

      {/* Main timeline backbone */}
      {connections.length > 0 && (
        <path
          d={connections.map((conn, index) => {
            if (index === 0) {
              return `M ${conn.start.x} ${conn.start.y}`;
            }
            return createSmoothPath(connections[index - 1].end, conn.end);
          }).join(' ')}
          stroke="url(#connectionGradient)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="5,5"
          opacity="0.6"
        />
      )}

      {/* Individual connections */}
      {connections.map((connection, index) => (
        <g key={connection.id}>
          {/* Main connection line */}
          <path
            d={createSmoothPath(connection.start, connection.end)}
            stroke="#6B7280"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
            markerEnd="url(#arrowhead)"
          />
          
          {/* Connection labels/indicators */}
          <g>
            {/* Midpoint indicator */}
            <circle
              cx={(connection.start.x + connection.end.x) / 2}
              cy={(connection.start.y + connection.end.y) / 2}
              r="4"
              fill="white"
              stroke="#6B7280"
              strokeWidth="2"
              opacity="0.7"
            />
            
            {/* Progress indicator text */}
            <text
              x={(connection.start.x + connection.end.x) / 2}
              y={(connection.start.y + connection.end.y) / 2 - 15}
              textAnchor="middle"
              className="text-xs fill-gray-500"
              opacity="0.6"
            >
              {index + 1}
            </text>
          </g>
        </g>
      ))}

      {/* Timeline milestones */}
      {data.map((node, index) => {
        const pos = positions[node.id];
        if (!pos) return null;
        
        return (
          <g key={`milestone-${node.id}`}>
            {/* Milestone base */}
            <circle
              cx={pos.x}
              cy={pos.y + 40}
              r="3"
              fill="#E5E7EB"
              stroke="#9CA3AF"
              strokeWidth="1"
            />
            
            {/* Timeline date */}
            <text
              x={pos.x}
              y={pos.y + 55}
              textAnchor="middle"
              className="text-xs fill-gray-400"
            >
              {new Date(node.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export { TimelineConnections };
