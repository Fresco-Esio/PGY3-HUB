import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Trash2, Plus } from 'lucide-react';

const ConnectionManager = ({ 
  isOpen, 
  onClose, 
  nodes, 
  connections, 
  onCreateConnection, 
  onDeleteConnection 
}) => {
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [connectionType, setConnectionType] = useState('related');

  const handleCreate = useCallback(() => {
    if (sourceNode && targetNode && sourceNode !== targetNode) {
      onCreateConnection(sourceNode, targetNode, connectionType);
      setSourceNode('');
      setTargetNode('');
      setConnectionType('related');
    }
  }, [sourceNode, targetNode, connectionType, onCreateConnection]);

  const handleDelete = useCallback((connectionId) => {
    onDeleteConnection(connectionId);
  }, [onDeleteConnection]);

  // Get node label by ID
  const getNodeLabel = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.label : nodeId;
  }, [nodes]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 400, duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <LinkIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Connection Manager
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create and manage connections between nodes
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Create Connection Form */}
            <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Create New Connection
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Source Node */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Node
                  </label>
                  <select
                    value={sourceNode}
                    onChange={(e) => setSourceNode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select source...</option>
                    {nodes.map(node => (
                      <option key={node.id} value={node.id}>
                        {node.label} ({node.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Node */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Node
                  </label>
                  <select
                    value={targetNode}
                    onChange={(e) => setTargetNode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    disabled={!sourceNode}
                  >
                    <option value="">Select target...</option>
                    {nodes
                      .filter(node => node.id !== sourceNode)
                      .map(node => (
                        <option key={node.id} value={node.id}>
                          {node.label} ({node.type})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Connection Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={connectionType}
                    onChange={(e) => setConnectionType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="related">Related</option>
                    <option value="causes">Causes</option>
                    <option value="treats">Treats</option>
                    <option value="requires">Requires</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={!sourceNode || !targetNode || sourceNode === targetNode}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Connection
              </button>
            </div>

            {/* Existing Connections List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Existing Connections ({connections.length})
              </h3>
              
              {connections.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No connections yet. Create one above!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn, index) => (
                    <motion.div
                      key={conn.id || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {getNodeLabel(conn.source)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            {getNodeLabel(conn.target)}
                          </span>
                        </div>
                        {conn.type && (
                          <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">
                            {conn.type}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(conn.id || `${conn.source}-${conn.target}`)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                        title="Delete connection"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConnectionManager;