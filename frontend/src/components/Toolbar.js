import React from 'react';
import { Bold, Italic, List } from 'lucide-react';

const Toolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-md border transition-all duration-200 hover:shadow-md ${
        isActive
          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
      }`}
      title={title}
      type="button"
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg mb-3">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        title="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        title="Italic"
      />
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={List}
        title="Bullet List"
      />
    </div>
  );
};

export default Toolbar;