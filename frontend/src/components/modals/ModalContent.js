// Modal Content Components - Reusable content blocks for modals
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Edit3, 
  Save, 
  Loader2, 
  Trash2, 
  Plus,
  Check,
  X
} from 'lucide-react';

// Card animation variants
const cardVariants = {
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3
    }
  },
  edit: {
    opacity: 1,
    scale: 1.02,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
    transition: {
      duration: 0.3
    }
  }
};

// Editable Section Component
export const EditableSection = ({
  title,
  icon: Icon,
  value,
  placeholder = "Click to add content...",
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isLoading = false,
  fieldType = 'textarea', // 'text', 'textarea', 'select'
  options = [], // for select fields
  rows = 6,
  className = ''
}) => {
  const [editValue, setEditValue] = useState(value || '');

  const handleEdit = () => {
    setEditValue(value || '');
    onEdit();
  };

  const handleSave = () => {
    onSave(editValue);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    onCancel();
  };

  const renderField = () => {
    const baseClasses = "w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none";
    
    switch (fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={baseClasses}
            placeholder={placeholder}
            autoFocus
          />
        );
      case 'select':
        return (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={baseClasses}
            autoFocus
          >
            <option value="">{placeholder}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={rows}
            className={baseClasses}
            placeholder={placeholder}
            autoFocus
          />
        );
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      animate={isEditing ? "edit" : "visible"}
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {Icon && <Icon size={20} className="text-blue-400" />}
          {title}
        </h3>
        {!isEditing && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEdit}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            title={`Edit ${title.toLowerCase()}`}
          >
            <Edit3 size={16} />
          </motion.button>
        )}
      </div>

      {isEditing ? (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderField()}
          <div className="flex justify-end gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCancel}
              className="px-3 py-2 text-slate-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          className="text-slate-300 leading-relaxed cursor-pointer hover:bg-slate-700/20 rounded-lg p-4 transition-colors min-h-[100px]"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={handleEdit}
        >
          {value ? (
            <div className="whitespace-pre-wrap">{value}</div>
          ) : (
            <span className="text-slate-500 italic">{placeholder}</span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

// Info Card Component
export const InfoCard = ({
  title,
  icon: Icon,
  children,
  className = '',
  actions = null
}) => (
  <motion.div
    variants={cardVariants}
    initial="visible"
    animate="visible"
    className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 ${className}`}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        {Icon && <Icon size={20} className="text-blue-400" />}
        {title}
      </h3>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
    <div className="text-slate-300">
      {children}
    </div>
  </motion.div>
);

// Status Badge Component
export const StatusBadge = ({ status, type = 'default' }) => {
  const getStatusStyles = () => {
    const statusMap = {
      active: 'bg-green-100 text-green-800 border-green-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
      follow_up: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
    };
    return statusMap[status] || 'bg-blue-100 text-blue-800 border-blue-200';
  };

  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

// Loading State Component
export const LoadingState = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <span className="text-sm text-slate-400">{message}</span>
    </div>
  </div>
);

// Empty State Component
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action = null 
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    {Icon && <Icon size={48} className="text-slate-600 mb-4" />}
    <h3 className="text-lg font-medium text-slate-300 mb-2">{title}</h3>
    <p className="text-slate-500 mb-4 max-w-md">{description}</p>
    {action}
  </div>
);

export default {
  EditableSection,
  InfoCard,
  StatusBadge,
  LoadingState,
  EmptyState
};