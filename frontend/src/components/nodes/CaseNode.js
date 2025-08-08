import React, { useState, useEffect } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Users,
  Calendar,
  CheckSquare,
  Clock,
  X,
  AlertCircle,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

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
      case "active":
        return "bg-green-100 text-green-800 border-green-200";
      case "archived":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "follow_up":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getUrgencyLevel = (data) => {
    // Simple urgency calculation based on keywords
    const urgentKeywords = ["emergency", "urgent", "crisis", "acute", "severe"];
    const complaint = data.chief_complaint?.toLowerCase() || "";
    const diagnosis = data.diagnosis?.toLowerCase() || "";

    if (
      urgentKeywords.some(
        (keyword) => complaint.includes(keyword) || diagnosis.includes(keyword)
      )
    ) {
      return "high";
    }
    return "normal";
  };

  const urgency = getUrgencyLevel(data);

  return (
    <motion.div
      initial={
        data.skipAnimation
          ? { opacity: 1, scale: 1 }
          : { opacity: 0, scale: 0.8, y: 20 }
      }
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: data.skipAnimation ? 0 : 0.15,
      }}
      whileHover={{
        scale: 1.05,
        y: -2,
        transition: { duration: 0.2 },
      }}
      className={`group relative min-w-[280px] max-w-[320px] cursor-pointer ${
        selected ? "z-10" : "z-0"
      }`}
    >
      {/* 🎨 ARTISTIC CARD CONTAINER with deep violet → plum gradient */}
      <div
        className={`
          relative px-6 py-4 rounded-2xl backdrop-blur-sm
          border transition-all duration-300 overflow-hidden
          shadow-lg hover:shadow-2xl
          ${
            selected
              ? "border-violet-300 shadow-violet-500/25 ring-4 ring-violet-200/50"
              : "border-violet-200/30 hover:border-violet-300/60"
          }
          ${urgency === "high" ? "ring-2 ring-red-400/60" : ""}
        `}
        style={{
          background:
            "linear-gradient(135deg, #581c87 0%, #7c3aed 25%, #a855f7 75%, #c084fc 100%)",
          boxShadow: selected
            ? "0 10px 25px -5px rgba(139, 92, 246, 0.4), 0 8px 10px -6px rgba(139, 92, 246, 0.3)"
            : "0 4px 15px -3px rgba(139, 92, 246, 0.25), 0 4px 6px -4px rgba(139, 92, 246, 0.1)",
        }}
      >
        {/* 🌟 GLOW EFFECT OVERLAY */}
        <div
          className={`
            absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
            transition-opacity duration-300 pointer-events-none
          `}
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1) 0%, transparent 70%)",
          }}
        />

        {/* 🔗 ENHANCED CONNECTION HANDLES */}
        {/* Top handles with violet theme */}
        <Handle
          id="top"
          type="source"
          position={Position.Top}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Right handles */}
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="right"
          type="target"
          position={Position.Right}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Bottom handles */}
        <Handle
          id="bottom"
          type="source"
          position={Position.Bottom}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="bottom"
          type="target"
          position={Position.Bottom}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />

        {/* Left handles */}
        <Handle
          id="left"
          type="source"
          position={Position.Left}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 2,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className="w-4 h-4 !bg-violet-400 !border-2 !border-white transition-all duration-300 hover:scale-125 cursor-pointer opacity-0 group-hover:opacity-100 hover:!bg-violet-300"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 1,
            boxShadow: "0 2px 8px rgba(139, 92, 246, 0.4)",
          }}
          isConnectable={true}
        />

        {/* 🚨 ENHANCED URGENCY INDICATOR */}
        {urgency === "high" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 -right-3"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle size={16} className="text-white" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* 📱 CARD HEADER with enhanced styling */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
              <Users size={18} className="text-violet-100 flex-shrink-0" />
              {data.linked_topics && data.linked_topics.length > 0 && (
                <div className="text-xs bg-violet-300 text-violet-900 px-2 py-0.5 rounded-full font-medium">
                  {data.linked_topics.length}
                </div>
              )}
            </div>
            <div className="font-bold text-lg text-white truncate leading-tight">
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
              <X size={16} className="text-violet-100" />
            </motion.button>
          )}
        </div>

        {/* 🏥 DIAGNOSIS with enhanced styling */}
        {data.diagnosis && (
          <div className="text-sm text-violet-100 mb-3 p-2 bg-white/10 rounded-lg backdrop-blur-sm font-medium">
            {data.diagnosis}
          </div>
        )}

        {/* 📊 ENHANCED PATIENT INFO GRID */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {data.age && (
            <div className="flex items-center gap-2 text-sm text-violet-100 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
              <Calendar size={14} className="text-violet-200" />
              <span className="font-medium">Age {data.age}</span>
            </div>
          )}

          {data.status && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 backdrop-blur-sm ${getStatusColor(
                data.status
              )}`}
            >
              {data.status.replace("_", " ").toUpperCase()}
            </div>
          )}
        </div>

        {/* 📋 PROGRESS INDICATORS with enhanced design */}
        {data.tasks_count && data.tasks_count > 0 && (
          <div className="flex items-center justify-between text-sm text-violet-100 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <CheckSquare size={14} className="text-violet-200" />
              <span className="font-medium">Tasks Progress</span>
            </div>
            <div className="font-bold">
              {data.completed_tasks || 0}/{data.tasks_count}
            </div>
          </div>
        )}

        {/* 👁️ VIEW TIMELINE BADGE (appears on hover) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { delay: 0.2 },
          }}
          className="opacity-0 group-hover:opacity-100 transition-all duration-300 mt-3"
        >
          <div className="flex items-center justify-center gap-2 bg-white/20 rounded-lg py-2 backdrop-blur-sm border border-white/30">
            <Eye size={16} className="text-white" />
            <span className="text-sm font-medium text-white">
              View Timeline
            </span>
          </div>
        </motion.div>

        {/* 🕐 LAST UPDATED INDICATOR with enhanced styling */}
        {data.updated_at && (
          <div className="absolute bottom-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Clock size={12} className="text-violet-100" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CaseNode;
