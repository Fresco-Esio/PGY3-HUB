// Timeline Node Component - Individual timeline entry node
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2,
  Clock,
  Pin,
  PinOff
} from 'lucide-react';

const TimelineNode = ({
  node,
  isSelected = false,
  isHovered = false,
  isPinned = false,
  onSelect,
  onEdit,
  onDelete,
  onPin,
  onUnpin,
  canvasRef
}) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(node.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(node.id);
  };

  const handlePin = (e) => {
    e.stopPropagation();
    if (isPinned && onUnpin) {
      onUnpin(node.id);
    } else if (!isPinned && onPin) {
      onPin(node.id, node.x, node.y);
    }
  };

  const handleClick = () => {
    if (onSelect) onSelect(node.id);
  };

  // Don't render DOM node since we're using canvas
  // This component is used for handling interactions over the canvas
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: node.x - 12,
        top: node.y - 12,
        width: 24,
        height: 24,
        zIndex: isHovered ? 20 : 10
      }}
    >
      {/* Invisible clickable area */}
      <div
        className="absolute inset-0 pointer-events-auto cursor-pointer"
        onClick={handleClick}
        title={node.label}
      />

      {/* Action buttons (visible on hover) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 pointer-events-auto"
        >
          <button
            onClick={handleEdit}
            className="p-1 text-slate-400 hover:text-blue-400 transition-colors rounded"
            title="Edit entry"
          >
            <Edit3 size={12} />
          </button>
          
          <button
            onClick={handlePin}
            className={`p-1 transition-colors rounded ${
              isPinned 
                ? 'text-yellow-400 hover:text-yellow-300' 
                : 'text-slate-400 hover:text-yellow-400'
            }`}
            title={isPinned ? "Unpin entry" : "Pin entry"}
          >
            {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          
          <button
            onClick={handleDelete}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded"
            title="Delete entry"
          >
            <Trash2 size={12} />
          </button>
        </motion.div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -inset-2 border-2 border-blue-400 rounded-full pointer-events-none"
        />
      )}

      {/* Pin indicator */}
      {isPinned && (
        <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full border border-slate-800 pointer-events-none">
          <Pin size={8} className="text-slate-800 m-0.5" />
        </div>
      )}
    </div>
  );
};

export default TimelineNode;