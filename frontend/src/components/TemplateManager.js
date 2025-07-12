import React, { useState, useEffect } from 'react';
import { X, Bookmark, Plus, Save, Edit3 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

const NODE_TYPE_FIELDS = {
  topic: [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g., Major Depressive Disorder' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter a detailed description...' },
    { name: 'category', label: 'Category', type: 'text', placeholder: 'e.g., Mood Disorders' },
  ],
  case: [
    { name: 'primary_diagnosis', label: 'Primary Diagnosis', type: 'text', placeholder: 'e.g., Bipolar I Disorder' },
    { name: 'assessment_plan', label: 'Assessment & Plan', type: 'textarea', placeholder: 'Enter assessment and plan details...' },
    { name: 'chief_complaint', label: 'Chief Complaint', type: 'text', placeholder: 'e.g., "I feel down all the time."' },
  ],
  task: [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g., Prepare presentation on SSRIs' },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter task details...' },
  ],
  literature: [
    { name: 'title', label: 'Title', type: 'text', placeholder: 'e.g., The Neurobiology of...' },
    { name: 'authors', label: 'Authors', type: 'text', placeholder: 'e.g., Kandel, E. R.' },
    { name: 'abstract', label: 'Abstract', type: 'textarea', placeholder: 'Paste or write the abstract here...' },
  ],
};

const TemplateManager = ({ isOpen, onClose, onCreate, onUpdate, templates, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedType, setSelectedType] = useState('topic');
  const [templateData, setTemplateData] = useState({});
  const [editingTemplate, setEditingTemplate] = useState(null);

  useEffect(() => {
    if (editingTemplate) {
      // Populate form with template data for editing
      setTemplateName(editingTemplate.name || '');
      setSelectedType(editingTemplate.nodeType || 'topic');
      setTemplateData(editingTemplate.data || {});
      setIsCreating(true);
    }
  }, [editingTemplate]);

  // Reset form when node type changes to avoid carrying over old data
  useEffect(() => {
    // Only clear data if we are in creation mode (not editing) and the type changes.
    if (isCreating && !editingTemplate) {
      setTemplateData({});
    }
  }, [selectedType, isCreating, editingTemplate]);

  if (!isOpen) { 
    return null;
  }

  const nodeTypes = ['topic', 'case', 'task', 'literature'];

  const handleDataChange = (field, value) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveTemplate = () => {
    // Basic validation to ensure a name is provided
    if (!templateName.trim()) {
      alert('Template name is required.');
      return;
    }

    const templatePayload = {
      id: editingTemplate ? editingTemplate.id : undefined,
      name: templateName,
      nodeType: selectedType,
      data: templateData,
    };

    if (editingTemplate) {
      onUpdate(templatePayload);
    } else {
      onCreate(templatePayload);
    }

    // Reset form state and close the creation view
    setTemplateName('');
    setSelectedType('topic');
    setTemplateData({});
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
  };

  const handleStartCreating = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setSelectedType('topic');
    setTemplateData({});
    setIsCreating(true);
  };

  const handleCancelCreation = () => {
    setIsCreating(false);
    setEditingTemplate(null); // Clear editing state
    setTemplateName('');
    setSelectedType('topic');
    setTemplateData({});
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Bookmark size={20} />
            {isCreating ? (editingTemplate ? 'Edit Template' : 'Create New Template') : 'Template Manager'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto">
          {isCreating ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Initial Psychiatric Evaluation"
                />
              </div>
              <div>
                <label htmlFor="node-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Node Type
                </label>
                <select
                  id="node-type"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {nodeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {/* Dynamically rendered fields */}
              {NODE_TYPE_FIELDS[selectedType].map(field => (
                <div key={field.name}>
                  <label htmlFor={`template-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <RichTextEditor
                      content={templateData[field.name] || ''}
                      onChange={(value) => handleDataChange(field.name, value)}
                      placeholder={field.placeholder}
                      rows={5}
                    />
                  ) : (
                    <input
                      type={field.type}
                      id={`template-${field.name}`}
                      value={templateData[field.name] || ''}
                      onChange={(e) => handleDataChange(field.name, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {templates && templates.length > 0 ? (
                <ul>
                  {templates.map((template) => (
                    <li
                      key={template.id}
                      className="flex justify-between items-center px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700">{template.name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditTemplate(template)} className="text-gray-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors" title={`Edit ${template.name}`}>
                          <Edit3 size={16} />
                        </button>
                        {onDelete && (
                          <button onClick={() => onDelete(template.id)} className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors" title={`Delete ${template.name}`}>
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No templates created yet.</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 mt-auto">
          {isCreating ? (
            <>
              <button
                onClick={handleCancelCreation}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                disabled={!templateName.trim()}
              >
                <Save size={16} />
                {editingTemplate ? 'Update Template' : 'Save Template'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleStartCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Create New
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateManager;