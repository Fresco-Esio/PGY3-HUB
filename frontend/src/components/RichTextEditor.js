import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Toolbar from './Toolbar';

const RichTextEditor = ({ content, onChange, placeholder, rows = 3 }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
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
    onCreate: () => {
      setIsInitialized(true);
    },
  });

  // Safely update editor content when content prop changes
  useEffect(() => {
    if (editor && isInitialized) {
      const currentContent = editor.getHTML();
      const newContent = content || '<p></p>';
      
      // Only update if content actually changed and avoid loops
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent, false);
      }
    }
  }, [content, editor, isInitialized]);

  if (!editor) {
    return (
      <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse" style={{minHeight: `${rows * 1.5}rem`}}>
        <div className="text-gray-400 text-sm">Loading editor...</div>
      </div>
    );
  }

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