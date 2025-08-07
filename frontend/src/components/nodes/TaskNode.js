import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckSquare, X, Clock, Flag, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TaskNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation with different timing for variety - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  // 🎨 Enhanced status styling with better visual hierarchy
  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #ea580c 100%)',
          ring: 'ring-orange-300/50',
          shadow: 'shadow-orange-500/30'
        };
      case 'in_progress':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
          ring: 'ring-blue-300/50',
          shadow: 'shadow-blue-500/30'
        };
      case 'completed':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          ring: 'ring-emerald-300/50',
          shadow: 'shadow-emerald-500/30',
          opacity: 'opacity-75'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 50%, #e74c3c 100%)',
          ring: 'ring-red-300/50',
          shadow: 'shadow-red-500/30'
        };
    }
  };

  // 🎯 Priority ring colors
  const getPriorityRing = (priority) => {
    switch (priority) {
      case 'high': return 'ring-4 ring-red-400 ring-opacity-70';
      case 'medium': return 'ring-4 ring-yellow-400 ring-opacity-70';
      case 'low': return 'ring-4 ring-green-400 ring-opacity-70';
      default: return '';
    }
  };

  const statusStyles = getStatusStyles(data.status);
  const priorityRing = getPriorityRing(data.priority);

  return (
    <motion.div
      initial={data.skipAnimation ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.68, -0.55, 0.265, 1.55],
        delay: data.skipAnimation ? 0 : 0.2
      }}
      whileHover={{ 
        scale: 1.05, 
        x: 2,
        transition: { duration: 0.2 }
      }}
      className={`group relative min-w-[240px] max-w-[280px] cursor-pointer ${selected ? 'z-10' : 'z-0'}`}
    >
      {/* 🎨 ARTISTIC TASK CONTAINER with bright coral theme */}
      <div
        className={`
          relative px-5 py-4 rounded-2xl backdrop-blur-sm
          border-2 transition-all duration-300 overflow-hidden
          shadow-lg hover:shadow-2xl text-white font-medium
          ${selected
            ? `border-white shadow-2xl ring-4 ring-white/30 ${statusStyles.shadow}` 
            : 'border-white/30 hover:border-white/60'
          }
          ${priorityRing}
          ${statusStyles.opacity || ''}
        `}
        style={{
          background: statusStyles.background,
          boxShadow: selected 
            ? '0 12px 32px -8px rgba(255, 107, 107, 0.4), 0 8px 16px -8px rgba(255, 107, 107, 0.3)'
            : '0 6px 20px -6px rgba(255, 107, 107, 0.25), 0 4px 8px -4px rgba(255, 107, 107, 0.1)'
        }}
      >
        {/* 🌟 ENERGY GLOW EFFECT */}
        <div 
          className={`
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
            transition-opacity duration-300 pointer-events-none
          `}
          style={{
            background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)',
          }}
        />

        {/* 🔗 ENHANCED CONNECTION HANDLES with coral theme */}
        {/* Top handles */}
        <Handle
          id="top"
          type="source"
          position={Position.Top}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />

        {/* Right handles */}
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />

        {/* Bottom handles */}
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />

        {/* Left handles */}
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-red-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-red-300"
          style={{
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            boxShadow: '0 2px 8px rgba(248, 113, 113, 0.4)'
          }}
          isConnectable={true}
        />

        {/* 🎯 PRIORITY INDICATOR with enhanced styling */}
        {data.priority && (
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute -top-3 -right-3"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-3 border-white shadow-lg
              ${data.priority === 'high' ? 'bg-red-500' : 
                data.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
              <Flag size={16} className="text-white" />
            </div>
          </motion.div>
        )}

        {/* ✅ TASK HEADER with status icons */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2 backdrop-blur-sm">
              {data.status === 'completed' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckSquare size={20} className="text-green-300" />
                </motion.div>
              ) : data.status === 'in_progress' ? (
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Target size={20} className="text-blue-300" />
                </motion.div>
              ) : (
                <Zap size={20} className="text-yellow-300" />
              )}
            </div>
            <div className="font-bold text-lg text-white leading-tight">
              {data.label}
            </div>
          </div>
          
          {data.onDelete && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                const deleteTimeout = setTimeout(() => {
                  e.stopPropagation();
                  data.onDelete();
                }, 300);
                e.currentTarget.deleteTimeout = deleteTimeout;
              }}
              onDoubleClick={(e) => {
                if (e.currentTarget.deleteTimeout) {
                  clearTimeout(e.currentTarget.deleteTimeout);
                  e.currentTarget.deleteTimeout = null;
                }
              }}
              className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <X size={16} className="text-white" />
            </motion.button>
          )}
        </div>

        {/* 📝 TASK DESCRIPTION */}
        {data.description && (
          <div className="text-sm text-white/90 mb-3 p-3 bg-white/15 rounded-xl backdrop-blur-sm leading-relaxed">
            {data.description}
          </div>
        )}

        {/* 📅 DUE DATE & PRIORITY INFO */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {data.due_date && (
            <div className="flex items-center gap-2 text-sm text-white/90 bg-white/15 rounded-lg p-2 backdrop-blur-sm">
              <Clock size={14} className="text-white" />
              <span className="font-medium">{data.due_date}</span>
            </div>
          )}

          {data.priority && (
            <div className="flex items-center gap-2 text-sm text-white/90 bg-white/15 rounded-lg p-2 backdrop-blur-sm">
              <Flag size={14} className="text-white" />
              <span className="font-medium capitalize">{data.priority}</span>
            </div>
          )}
        </div>

        {/* 📊 PROGRESS RING for tasks with subtasks */}
        {data.total_subtasks && data.total_subtasks > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/90">Subtasks</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {data.completed_subtasks || 0}/{data.total_subtasks}
              </span>
              <div className="relative w-6 h-6">
                <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <motion.circle
                    cx="12"
                    cy="12"
                    r="8"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 8}`}
                    strokeDashoffset={`${2 * Math.PI * 8 * (1 - ((data.completed_subtasks || 0) / data.total_subtasks))}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 8 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 8 * (1 - ((data.completed_subtasks || 0) / data.total_subtasks))
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* 🕐 LAST UPDATED with enhanced styling */}
        {data.updated_at && (
          <div className="absolute bottom-2 right-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Clock size={12} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TaskNode;