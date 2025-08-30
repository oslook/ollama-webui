'use client';

import { useState, useEffect, useCallback } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import ChatMessage from './components/ChatMessage';
import ModelSelector from './components/ModelSelector';
import Settings from './components/Settings';
import ConversationList from './components/ConversationList';
import { Conversation, Message } from './types';
import ThemeToggle from "./components/ThemeToggle";
import WelcomeDialog, { HelpButton } from './components/WelcomeDialog';
import { useAppStore } from './store/useAppStore';

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Use Zustand store
  const {
    conversations,
    ollamaUrl,
    hasVisited,
    setConversations,
    addConversation,
    updateConversation,
    deleteConversation,
    setOllamaUrl,
    setHasVisited,
    getCurrentConversation
  } = useAppStore();

  // Initialize loading
  useEffect(() => {
    setMounted(true);
    if (conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, [conversations]);

  // Check if first visit - only show welcome dialog once
  useEffect(() => {
    console.log(hasVisited)
    if (!hasVisited) {
      setShowWelcomeDialog(true);
      setHasVisited(true);
    }
  }, [hasVisited, setHasVisited]);

  const currentConversation = getCurrentConversation(currentConversationId);

  const handleNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addConversation(newConversation);
    setCurrentConversationId(newConversation.id);
  }, [selectedModel, addConversation]);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id);
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [currentConversationId, conversations, deleteConversation]);

  const handleUrlChange = useCallback((newUrl: string) => {
    setOllamaUrl(newUrl);
  }, [setOllamaUrl]);

  const updateConversationTitle = useCallback((id: string, firstMessage: string) => {
    updateConversation(id, {
      title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
      updatedAt: new Date().toISOString()
    });
  }, [updateConversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel || loading) return;

    if (!currentConversationId) {
      handleNewConversation();
      return;
    }

    const newMessage: Message = { role: 'user', content: input };
    const currentMessages = currentConversation?.messages || [];
    
    updateConversation(currentConversationId!, {
      messages: [...(currentConversation?.messages || []), newMessage],
      updatedAt: new Date().toISOString()
    });
    if (currentConversation?.messages.length === 0) {
      updateConversationTitle(currentConversationId!, input);
    }

    setInput('');
    setLoading(true);
    setError(null);
    setStreamingMessage('');

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...currentMessages, newMessage],
          stream: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }

      const decoder = new TextDecoder();
      let accumulatedMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              accumulatedMessage += data.message.content;
              setStreamingMessage(accumulatedMessage);
            }
          } catch (e) {
            console.warn('Failed to parse line:', line);
          }
        }
      }

      if (accumulatedMessage) {
        updateConversation(currentConversationId!, {
          messages: [...(currentConversation?.messages || []), { role: 'assistant', content: accumulatedMessage }],
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error in chat request:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLoading(false);
      setStreamingMessage('');
    }
  };

  const displayMessages = currentConversation ? [
    ...currentConversation.messages,
    ...(streamingMessage ? [{ role: 'assistant', content: streamingMessage }] : [])
  ] : [];

  const handleImportConversations = useCallback((imported: Conversation[]) => {
    const existingIds = new Set(conversations.map(c => c.id));
    const newConversations = imported.filter(c => !existingIds.has(c.id));
    setConversations([...newConversations, ...conversations]);
  }, [conversations, setConversations]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen">
      <ConversationList
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSelect={(conv) => setCurrentConversationId(conv.id)}
        onNew={handleNewConversation}
        onDelete={handleDeleteConversation}
      />
      
      <div className="flex-1 flex flex-col">
        <header className="p-4 border-b">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <h1 className="text-2xl font-bold">Ollama Chat</h1>
            <div className="flex items-center gap-4">
              <ModelSelector
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
                baseUrl={ollamaUrl}
              />
              <Settings
                onUrlChange={handleUrlChange}
                initialUrl={ollamaUrl}
                conversations={conversations}
                onConversationsImport={handleImportConversations}
              />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <div className="max-w-6xl mx-auto">
            {displayMessages.map((message, index) => (
              <ChatMessage
                key={`${currentConversationId}-${index}`}
                role={message.role}
                content={message.content}
              />
            ))}
            {error && (
              <div className="text-error text-center p-4">
                Error: {error}
              </div>
            )}
          </div>
        </main>

        <footer className="p-4 border-t">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="input input-bordered flex-1"
              disabled={loading || !selectedModel}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedModel || !input.trim()}
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </div>

      {/* Help button */}
      <HelpButton onClick={() => setShowWelcomeDialog(true)} />

      {/* Welcome dialog */}
      <WelcomeDialog
        isOpen={showWelcomeDialog}
        onClose={() => setShowWelcomeDialog(false)}
      />
    </div>
  );
}