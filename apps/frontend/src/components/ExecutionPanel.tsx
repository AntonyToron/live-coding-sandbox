'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/contexts/SocketContext';

interface ExecutionPanelProps {
  padId: string;
  code: string;
  language: string;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  execution_time: number;
}

export default function ExecutionPanel({ padId, code, language }: ExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('execution-started', () => {
      setIsExecuting(true);
    });

    socket.on('execution-result', (result: ExecutionResult) => {
      setIsExecuting(false);
      setResults(prev => [...prev, result]);
    });

    return () => {
      socket.off('execution-started');
      socket.off('execution-result');
    };
  }, [socket, isConnected]);

  const executeCode = () => {
    if (!socket || !isConnected || isExecuting) return;

    socket.emit('execute-code', {
      padId,
      code,
      language,
    });
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Output</h3>
        <div className="flex space-x-2">
          <button
            onClick={executeCode}
            disabled={isExecuting || !isConnected}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm font-medium transition-colors"
          >
            {isExecuting ? 'Running...' : 'Run'}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="bg-red-600 text-white px-4 py-2 text-sm">
          Disconnected - Real-time features unavailable
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {results.length === 0 ? (
          <div className="text-gray-400 text-center mt-8">
            Click &quot;Run&quot; to execute your code
          </div>
        ) : (
          results.map((result, index) => (
            <div key={index} className="border border-gray-700 rounded">
              {/* Result header */}
              <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      result.success ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-gray-300">
                    {result.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {result.execution_time}ms
                </span>
              </div>

              {/* Result content */}
              <div className="p-3">
                {result.success ? (
                  <pre className="text-green-400 text-sm whitespace-pre-wrap font-mono">
                    {result.output || '(no output)'}
                  </pre>
                ) : (
                  <pre className="text-red-400 text-sm whitespace-pre-wrap font-mono">
                    {result.error || 'Unknown error'}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}