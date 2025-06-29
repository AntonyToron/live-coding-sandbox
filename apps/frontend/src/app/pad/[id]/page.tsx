'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { Pad, padAPI } from '@/lib/api';
import CodeEditor from '@/components/CodeEditor';
import ExecutionPanel from '@/components/ExecutionPanel';

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
];

function PadEditorContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [pad, setPad] = useState<Pad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  const padId = params.id as string;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && padId) {
      loadPad();
    }
  }, [isAuthenticated, authLoading, padId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPad = async () => {
    try {
      const response = await padAPI.get(padId);
      const padData = response.data.pad;
      
      setPad(padData);
      setTitle(padData.title);
      setLanguage(padData.language);
      setCode(padData.code);
      setIsOwner(user?.id === padData.user_id);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load pad');
      console.error('Load pad error:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePad = async () => {
    if (!isOwner || !pad) return;

    try {
      await padAPI.update(pad.id, { title, language, code });
      console.log('Pad saved successfully');
    } catch (err) {
      console.error('Save pad error:', err);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    // Auto-save after a delay (debounced)
    if (isOwner) {
      setTimeout(savePad, 1000);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (isOwner) {
      setTimeout(savePad, 1000);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    if (isOwner) {
      setTimeout(savePad, 1000);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!pad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Pad not found</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Back
            </button>
            {isOwner ? (
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
            ) : (
              <h1 className="text-xl font-semibold">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isOwner ? (
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {SUPPORTED_LANGUAGES.find(l => l.value === language)?.label}
              </span>
            )}
            
            <div className="text-sm text-gray-500">
              {isOwner ? 'Owner' : 'Guest'}
            </div>
          </div>
        </div>
      </div>

      {/* Main content - Split pane */}
      <div className="flex-1 flex">
        {/* Code editor */}
        <div className="w-1/2 border-r border-gray-200">
          <CodeEditor
            padId={padId}
            initialCode={code}
            language={language}
            username={user?.username || 'Anonymous'}
            onCodeChange={handleCodeChange}
          />
        </div>

        {/* Execution panel */}
        <div className="w-1/2">
          <ExecutionPanel
            padId={padId}
            code={code}
            language={language}
          />
        </div>
      </div>
    </div>
  );
}

export default function PadPage() {
  return (
    <SocketProvider>
      <PadEditorContent />
    </SocketProvider>
  );
}