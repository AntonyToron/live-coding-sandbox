'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useSocket } from '@/contexts/SocketContext';

interface CodeEditorProps {
  padId: string;
  initialCode: string;
  language: string;
  username: string;
  onCodeChange?: (code: string) => void;
}

export default function CodeEditor({ 
  padId, 
  initialCode, 
  language, 
  username,
  onCodeChange 
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [users, setUsers] = useState<{ id: string; username: string }[]>([]);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join the pad room
    socket.emit('join-pad', { padId, username });

    // Listen for code changes from other users
    socket.on('code-changed', ({ code: newCode, userId }) => {
      if (userId !== socket.id) {
        setCode(newCode);
        onCodeChange?.(newCode);
      }
    });

    // Listen for user presence updates
    socket.on('user-joined', ({ id, username: joinedUsername }) => {
      setUsers(prev => [...prev.filter(u => u.id !== id), { id, username: joinedUsername }]);
    });

    socket.on('user-left', ({ id }) => {
      setUsers(prev => prev.filter(u => u.id !== id));
    });

    socket.on('pad-joined', ({ users: padUsers }) => {
      setUsers(padUsers);
    });

    // Listen for cursor changes
    socket.on('cursor-changed', ({ username: cursorUsername, position }) => {
      // TODO: Implement cursor visualization
      console.log(`${cursorUsername} cursor at:`, position);
    });

    return () => {
      socket.emit('leave-pad');
      socket.off('code-changed');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('pad-joined');
      socket.off('cursor-changed');
    };
  }, [socket, isConnected, padId, username, onCodeChange]);

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;

    // Listen for cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (socket && isConnected) {
        const position = {
          line: e.position.lineNumber,
          column: e.position.column,
        };
        socket.emit('cursor-change', { padId, position });
      }
    });

    // Listen for typing start/stop
    let typingTimeout: NodeJS.Timeout;
    editor.onDidChangeModelContent(() => {
      if (socket && isConnected) {
        socket.emit('typing-start', { padId });
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          socket.emit('typing-stop', { padId });
        }, 1000);
      }
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    onCodeChange?.(newCode);

    // Broadcast changes to other users
    if (socket && isConnected) {
      socket.emit('code-change', {
        padId,
        code: newCode,
        changes: [], // TODO: Implement operational transformation
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Active users indicator */}
      {users.length > 0 && (
        <div className="bg-gray-100 px-4 py-2 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Active users:</span>
            {users.map((user) => (
              <span
                key={user.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {user.username}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={handleCodeChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            folding: true,
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            mouseWheelZoom: true,
            cursorBlinking: 'blink',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>
    </div>
  );
}