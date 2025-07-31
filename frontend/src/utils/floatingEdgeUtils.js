// Floating Edge Utilities for React Flow
// Calculates intersection points between nodes for custom floating edges

/**
 * Calculate the intersection point of a line with a rectangle
 * @param {Object} rect - Rectangle with x, y, width, height
 * @param {Object} center - Center point with x, y
 * @param {Object} point - External point with x, y
 * @returns {Object} Intersection point with x, y coordinates
 */
function getIntersectionPoint(rect, center, point) {
  const { x: rectX, y: rectY, width, height } = rect;
  const { x: centerX, y: centerY } = center;
  const { x: pointX, y: pointY } = point;

  // Calculate rectangle bounds - no buffer as we want exact edges
  const left = rectX;
  const right = rectX + width;
  const top = rectY;
  const bottom = rectY + height;

  // Direction vector from center to point
  const dx = pointX - centerX;
  const dy = pointY - centerY;

  // Handle edge cases where the line is vertical or horizontal
  if (Math.abs(dx) < 0.001) {
    // Vertical line
    return {
      x: centerX,
      y: dy > 0 ? bottom : top,
      side: dy > 0 ? 'bottom' : 'top'
    };
  }

  if (Math.abs(dy) < 0.001) {
    // Horizontal line
    return {
      x: dx > 0 ? right : left,
      y: centerY,
      side: dx > 0 ? 'right' : 'left'
    };
  }

  // Calculate slope and y-intercept
  const slope = dy / dx;
  const yIntercept = centerY - slope * centerX;

  // Calculate intersection points with all four sides
  const intersections = [];

  // Left side (x = left)
  const leftY = slope * left + yIntercept;
  if (leftY >= top && leftY <= bottom) {
    intersections.push({ x: left, y: leftY, side: 'left', distance: Math.hypot(left - centerX, leftY - centerY) });
  }

  // Right side (x = right)
  const rightY = slope * right + yIntercept;
  if (rightY >= top && rightY <= bottom) {
    intersections.push({ x: right, y: rightY, side: 'right', distance: Math.hypot(right - centerX, rightY - centerY) });
  }

  // Top side (y = top)
  const topX = (top - yIntercept) / slope;
  if (topX >= left && topX <= right) {
    intersections.push({ x: topX, y: top, side: 'top', distance: Math.hypot(topX - centerX, top - centerY) });
  }

  // Bottom side (y = bottom)
  const bottomX = (bottom - yIntercept) / slope;
  if (bottomX >= left && bottomX <= right) {
    intersections.push({ x: bottomX, y: bottom, side: 'bottom', distance: Math.hypot(bottomX - centerX, bottom - centerY) });
  }

  // Find the intersection point that's in the correct direction
  // and is closest to the center (to avoid picking the wrong side)
  const validIntersections = intersections.filter(intersection => {
    const intersectionDx = intersection.x - centerX;
    const intersectionDy = intersection.y - centerY;
    
    // Check if the intersection is in the same direction as the target point
    return (
      (dx > 0 && intersectionDx >= 0) || (dx < 0 && intersectionDx <= 0)
    ) && (
      (dy > 0 && intersectionDy >= 0) || (dy < 0 && intersectionDy <= 0)
    );
  });

  // Sort by distance and take the closest valid intersection
  validIntersections.sort((a, b) => a.distance - b.distance);
  return validIntersections[0] || { x: centerX, y: centerY, side: 'center' };
}

/**
 * Calculate the floating edge path between two nodes
 * @param {Object} sourceNode - Source node with position and measured dimensions
 * @param {Object} targetNode - Target node with position and measured dimensions
 * @param {Object} options - Optional configuration
 * @returns {Object} Edge path data with sourceX, sourceY, targetX, targetY
 */
export function getFloatingEdgePath(sourceNode, targetNode, options = {}) {
  const {
    sourcePosition = { x: 0, y: 0 },
    targetPosition = { x: 0, y: 0 },
    sourceWidth = 200,
    sourceHeight = 100,
    targetWidth = 200,
    targetHeight = 100,
    // Direct coordinates from React Flow (fallback)
    sourceX,
    sourceY,
    targetX,
    targetY,
    offset = 0 // Default to zero offset to ensure edges connect to borders
  } = options;
  
  // Use direct coordinates if provided and dimensions appear invalid
  if (sourceX !== undefined && sourceY !== undefined && 
      targetX !== undefined && targetY !== undefined &&
      (sourceWidth <= 10 || targetWidth <= 10)) {
    return {
      sourceX, 
      sourceY, 
      targetX, 
      targetY,
      sourceSide: 'direct',
      targetSide: 'direct'
    };
  }

  // Calculate node centers
  const sourceCenter = {
    x: sourcePosition.x + sourceWidth / 2,
    y: sourcePosition.y + sourceHeight / 2
  };

  const targetCenter = {
    x: targetPosition.x + targetWidth / 2,
    y: targetPosition.y + targetHeight / 2
  };

  // Create rectangle objects for intersection calculation
  const sourceRect = {
    x: sourcePosition.x,
    y: sourcePosition.y,
    width: sourceWidth,
    height: sourceHeight
  };

  const targetRect = {
    x: targetPosition.x,
    y: targetPosition.y,
    width: targetWidth,
    height: targetHeight
  };

  // Calculate intersection points
  const sourceIntersection = getIntersectionPoint(sourceRect, sourceCenter, targetCenter);
  const targetIntersection = getIntersectionPoint(targetRect, targetCenter, sourceCenter);

  // Calculate vector from source to target center
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Add a stronger extension to ensure visual connection with the node borders
  // This is done by extending the line in both directions
  if (distance > 0) {
    const unitX = dx / distance;
    const unitY = dy / distance;
    
    // Extend lines by 3 pixels to ensure visual connection
    // Using a larger value for more reliability across different node types
    const extensionAmount = 3;

    // Extend the line outward from the source node
    sourceIntersection.x -= unitX * extensionAmount;
    sourceIntersection.y -= unitY * extensionAmount;
    
    // Extend the line outward from the target node
    targetIntersection.x += unitX * extensionAmount;
    targetIntersection.y += unitY * extensionAmount;
    
    // Apply additional offset if needed
    if (offset > 0) {
      sourceIntersection.x += unitX * offset;
      sourceIntersection.y += unitY * offset;
      targetIntersection.x -= unitX * offset;
      targetIntersection.y -= unitY * offset;
    }
  }

  // Debug flag to help diagnose intersection issues
  const debug = options.debug || false;
  if (debug) {
    console.log('Source Node:', sourceNode);
    console.log('Target Node:', targetNode);
    console.log('Source Intersection:', sourceIntersection);
    console.log('Target Intersection:', targetIntersection);
  }

  return {
    sourceX: sourceIntersection.x,
    sourceY: sourceIntersection.y,
    targetX: targetIntersection.x,
    targetY: targetIntersection.y,
    sourceSide: sourceIntersection.side,
    targetSide: targetIntersection.side
  };
}

/**
 * Generate SVG path string for a bezier curve between two points
 * @param {number} sourceX - Source X coordinate
 * @param {number} sourceY - Source Y coordinate
 * @param {number} targetX - Target X coordinate
 * @param {number} targetY - Target Y coordinate
 * @param {number} curvature - Curve intensity (0-1)
 * @returns {string} SVG path string
 */
export function getBezierPath(sourceX, sourceY, targetX, targetY, curvature = 0.25) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  
  // Calculate control points for a smooth bezier curve
  const controlOffset = Math.sqrt(dx * dx + dy * dy) * curvature;
  
  const controlX1 = sourceX + dx * 0.5 + dy * controlOffset * 0.5;
  const controlY1 = sourceY + dy * 0.5 - dx * controlOffset * 0.5;
  
  const controlX2 = sourceX + dx * 0.5 - dy * controlOffset * 0.5;
  const controlY2 = sourceY + dy * 0.5 + dx * controlOffset * 0.5;
  
  return `M ${sourceX},${sourceY} C ${controlX1},${controlY1} ${controlX2},${controlY2} ${targetX},${targetY}`;
}

/**
 * Calculate the center point of an edge path
 * @param {number} sourceX - Source X coordinate
 * @param {number} sourceY - Source Y coordinate
 * @param {number} targetX - Target X coordinate
 * @param {number} targetY - Target Y coordinate
 * @returns {Object} Center point with x, y coordinates
 */
export function getEdgeCenter(sourceX, sourceY, targetX, targetY) {
  return {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2
  };
}

/**
 * Calculate marker end position for arrow heads
 * @param {number} sourceX - Source X coordinate
 * @param {number} sourceY - Source Y coordinate
 * @param {number} targetX - Target X coordinate
 * @param {number} targetY - Target Y coordinate
 * @returns {string} Transform string for marker positioning
 */
export function getMarkerEnd(sourceX, sourceY, targetX, targetY) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  return `url(#arrowhead) rotate(${angle} ${targetX} ${targetY})`;
}
