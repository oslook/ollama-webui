'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Use Zustand store
  const {
    conversations,
    currentConversationId,
    ollamaUrl,
    hasVisited,
    setConversations,
    addConversation,
    updateConversation,
    appendMessage,
    deleteConversation,
    setCurrentConversationId,
    setOllamaUrl,
    setHasVisited,
    getCurrentConversation
  } = useAppStore();

  // Initialize on mount: select the most recent conversation (list is
  // ordered newest-first). Runs once so it doesn't fight user selection.
  useEffect(() => {
    setMounted(true);
    const { conversations, currentConversationId, setCurrentConversationId } =
      useAppStore.getState();
    if (!currentConversationId && conversations.length > 0) {
      setCurrentConversationId(conversations[0].id);
    }
  }, []);

  // Check if first visit - only show welcome dialog once
  useEffect(() => {
    if (!hasVisited) {
      setShowWelcomeDialog(true);
      setHasVisited(true);
    }
  }, [hasVisited, setHasVisited]);

  const currentConversation = getCurrentConversation(currentConversationId);

  const handleNewConversation = useCallback((): string => {
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
    return newConversation.id;
  }, [selectedModel, addConversation, setCurrentConversationId]);

  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id);
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [currentConversationId, conversations, deleteConversation, setCurrentConversationId]);

  const handleUrlChange = useCallback((newUrl: string) => {
    setOllamaUrl(newUrl);
  }, [setOllamaUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel || loading) return;

    // Ensure a conversation exists, and keep going in the same handler
    // so the first message is not dropped.
    const conversationId = currentConversationId ?? handleNewConversation();

    const userMessage: Message = { role: 'user', content: input };

    // Read the latest messages from the store (not a stale render snapshot)
    // to build the request payload and to derive the title.
    const existingMessages =
      useAppStore.getState().getCurrentConversation(conversationId)?.messages ?? [];
    const isFirstMessage = existingMessages.length === 0;

    appendMessage(conversationId, userMessage);
    if (isFirstMessage) {
      updateConversation(conversationId, {
        title: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
      });
    }

    setInput('');
    setLoading(true);
    setError(null);
    setStreamingMessage('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...existingMessages, userMessage],
          stream: true
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last (possibly partial) line in the buffer.
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              accumulatedMessage += data.message.content;
              setStreamingMessage(accumulatedMessage);
            }
          } catch (err) {
            console.warn('Failed to parse line:', line);
          }
        }
      }

      // Flush any trailing complete JSON object left in the buffer.
      if (buffer.trim() !== '') {
        try {
          const data = JSON.parse(buffer);
          if (data.message?.content) {
            accumulatedMessage += data.message.content;
          }
        } catch (err) {
          console.warn('Failed to parse trailing buffer:', buffer);
        }
      }

      if (accumulatedMessage) {
        appendMessage(conversationId, { role: 'assistant', content: accumulatedMessage });
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Persist whatever was streamed before the user aborted.
        if (streamingMessage) {
          appendMessage(conversationId, { role: 'assistant', content: streamingMessage });
        }
      } else {
        console.error('Error in chat request:', error);
        setError(error instanceof Error ? error.message : 'Failed to send message');
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      setStreamingMessage('');
    }
  };

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const displayMessages = currentConversation ? [
    ...currentConversation.messages,
    ...(streamingMessage ? [{ role: 'assistant' as const, content: streamingMessage }] : [])
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
                key={`${currentConversationId}-${index}-${message.role}`}
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
            {loading ? (
              <button
                type="button"
                onClick={handleStop}
                className="btn btn-error"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!selectedModel || !input.trim()}
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            )}
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