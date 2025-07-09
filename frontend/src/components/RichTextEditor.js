import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from './Toolbar';

const RichTextEditor = ({ content, onChange, placeholder, rows = 3 }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: `w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors prose prose-sm max-w-none`,
        style: `min-height: ${rows * 1.5}rem;`,
      },
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  return (
    <div className="rich-text-editor">
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="min-h-0"
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;