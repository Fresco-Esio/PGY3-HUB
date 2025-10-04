import React from "react";
import { Handle, Position } from "@xyflow/react";
import { Users, X, AlertCircle, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const CircularCaseNode = ({ data, selected }) => {
  const isExpanded = data.isExpanded || false;

  const baseSize = 130; // Slightly larger for case nodes
  const expandedSize = 320;

  return (
    <motion.div
      className={`relative cursor-pointer ${selected ? "z-50" : "z-10"}`}
      animate={{
        width: isExpanded ? expandedSize : baseSize,
        height: isExpanded ? expandedSize : baseSize,
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Connection Handles */}
      <Handle
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ left: "50%", transform: "translateX(-50%)", zIndex: -1 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-white opacity-0 hover:opacity-100 transition-opacity"
        style={{ top: "50%", transform: "translateY(-50%)", zIndex: -1 }}
      />

      {/* Incomplete Data Indicator */}
      {data._hasIncompleteData && !isExpanded && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 z-10"
          title={`Missing: ${(data._missingFields || []).join(', ')}`}
        >
          <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <AlertCircle size={14} className="text-white" />
          </div>
        </motion.div>
      )}

      {/* Circular Node Container */}
      <motion.div
        className={`
          w-full h-full rounded-full
          flex flex-col items-center justify-center
          border-4 transition-all duration-300
          ${selected 
            ? "border-indigo-400 shadow-2xl ring-4 ring-indigo-200" 
            : "border-indigo-300 shadow-lg hover:shadow-xl"
          }
          ${data._hasIncompleteData ? "ring-2 ring-amber-400" : ""}
        `}
        style={{
          background: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)",
        }}
        whileHover={{ scale: isExpanded ? 1 : 1.05 }}
        transition={{ duration: 0.2 }}
      >
        {!isExpanded ? (
          // Collapsed State
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Users size={36} className="text-white mb-2" />
            <div className="text-white font-semibold text-sm leading-tight line-clamp-2">
              {data.label || "Patient Case"}
            </div>
            {data.status && (
              <div className="text-indigo-100 text-xs mt-1 capitalize">
                {data.status.replace('_', ' ')}
              </div>
            )}
          </div>
        ) : (
          // Expanded State
          <div className="w-full h-full p-6 overflow-y-auto text-white relative">
            {/* Close button - click anywhere to collapse */}
            <div className="absolute top-2 right-2 text-xs text-indigo-200">
              Click to collapse
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <Users size={24} />
              <div className="font-bold text-base leading-tight">
                {data.label || "Patient Case"}
              </div>
            </div>

            {/* Status Badge */}
            {data.status && (
              <div className="text-xs bg-white/20 rounded px-2 py-1 mb-3 inline-block capitalize">
                {data.status.replace('_', ' ')}
              </div>
            )}

            {/* Name Info */}
            {(data.firstName || data.lastName) && (
              <div className="text-sm mb-3">
                <span className="font-semibold">Name: </span>
                {data.firstName} {data.lastName}
              </div>
            )}

            {/* Chief Complaint */}
            {(data.chief_complaint || data.chiefComplaint) && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Chief Complaint:</div>
                <div className="text-sm bg-white/10 rounded p-2 leading-relaxed">
                  {data.chief_complaint || data.chiefComplaint}
                </div>
              </div>
            )}

            {/* Initial Presentation */}
            {(data.initial_presentation || data.initialPresentation) && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Initial Presentation:</div>
                <div className="text-sm bg-white/10 rounded p-2 leading-relaxed">
                  {data.initial_presentation || data.initialPresentation}
                </div>
              </div>
            )}

            {/* Narrative Summary */}
            {data.narrative_summary && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Narrative:</div>
                <div className="text-sm bg-white/10 rounded p-2 leading-relaxed">
                  {data.narrative_summary}
                </div>
              </div>
            )}

            {/* Medications */}
            {data.medications && data.medications.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-semibold mb-1">Medications:</div>
                <div className="space-y-1">
                  {data.medications.map((med, idx) => (
                    <div key={idx} className="text-xs bg-green-900/30 rounded px-2 py-1">
                      {med.name} {med.dosage && `- ${med.dosage}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Fields Warning */}
            {data._hasIncompleteData && (
              <div className="mt-3 text-xs bg-amber-900/30 border border-amber-600/50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle size={12} />
                  <span className="font-semibold">Incomplete Data</span>
                </div>
                <div>Missing: {(data._missingFields || []).join(', ')}</div>
              </div>
            )}

            {/* Last Updated */}
            {data.last_updated && (
              <div className="text-xs text-indigo-200 mt-3">
                Updated: {new Date(data.last_updated).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Delete button - only in collapsed state */}
        {!isExpanded && data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="absolute -top-2 -left-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-lg transition-colors z-10"
          >
            <X size={14} />
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default CircularCaseNode;
