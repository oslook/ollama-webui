'use client';

import { useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import ChatMessage from './components/ChatMessage';
import ModelSelector from './components/ModelSelector';
import Settings from './components/Settings';
import ConversationList from './components/ConversationList';
import { Conversation, Message } from './types';

// 从localStorage获取保存的URL，如果没有则使用默认值
const getSavedUrl = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ollamaUrl') || 'http://127.0.0.1:11434';
  }
  return 'http://127.0.0.1:11434';
};

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [baseUrl, setBaseUrl] = useState(getSavedUrl);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState('');

  // 从localStorage加载会话
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed);
      // 如果有会话，选择最新的一个
      if (parsed.length > 0) {
        setCurrentConversationId(parsed[0].id);
      }
    }
  }, []);

  // 保存会话到localStorage
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  }, [conversations]);

  const currentConversation = conversations.find(c => c.id === currentConversationId);

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: generateId(),
      title: 'New Chat',
      messages: [],
      model: selectedModel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
  };

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    localStorage.setItem('ollamaUrl', newUrl);
  };

  const updateConversationTitle = (id: string, firstMessage: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === id) {
        return {
          ...conv,
          title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
          updatedAt: new Date().toISOString()
        };
      }
      return conv;
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedModel) return;

    // 如果没有当前会话，创建一个新的
    if (!currentConversationId) {
      handleNewConversation();
      return; // 等待下一个渲染周期再发送消息
    }

    const newMessage: Message = { role: 'user', content: input };
    const currentMessages = currentConversation?.messages || [];
    
    // 更新会话，添加用户消息
    setConversations(prev => prev.map(conv => {
      if (conv.id === currentConversationId) {
        const updatedMessages = [...conv.messages, newMessage];
        // 如果是第一条消息，更新会话标题
        if (conv.messages.length === 0) {
          updateConversationTitle(conv.id, input);
        }
        return {
          ...conv,
          messages: updatedMessages,
          updatedAt: new Date().toISOString()
        };
      }
      return conv;
    }));

    setInput('');
    setLoading(true);
    setError(null);
    setStreamingMessage('');

    try {
      const response = await fetch(`${baseUrl}/api/chat`, {
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
        const errorText = await response.text();
        console.error('Server response error:', response.status, errorText);
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to read response');
      }

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

      // 流式响应结束，更新会话
      if (accumulatedMessage) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: accumulatedMessage
        };

        setConversations(prev => prev.map(conv => {
          if (conv.id === currentConversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
              updatedAt: new Date().toISOString()
            };
          }
          return conv;
        }));
      }
    } catch (error) {
      console.error('Error in chat request:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLoading(false);
      setStreamingMessage('');
    }
  };

  // 获取当前要显示的所有消息，包括流式消息
  const displayMessages = currentConversation ? [
    ...currentConversation.messages,
    ...(streamingMessage ? [{ role: 'assistant', content: streamingMessage }] : [])
  ] : [];

  const handleImportConversations = (imported: Conversation[]) => {
    // 合并导入的会话，保持现有的会话
    setConversations(prev => {
      // 创建一个 Set 来存储现有的会话 ID
      const existingIds = new Set(prev.map(c => c.id));
      
      // 过滤掉已存在的会话，只添加新的会话
      const newConversations = imported.filter(c => !existingIds.has(c.id));
      
      // 将新会话添加到现有会话列表的开头
      return [...newConversations, ...prev];
    });
  };

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
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <h1 className="text-2xl font-bold">Ollama Chat</h1>
            <div className="flex items-center gap-4">
              <ModelSelector
                selectedModel={selectedModel}
                onModelSelect={setSelectedModel}
                baseUrl={baseUrl}
              />
              <Settings 
                onUrlChange={handleUrlChange} 
                initialUrl={baseUrl}
                conversations={conversations}
                onConversationsImport={handleImportConversations}
              />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          {displayMessages.map((message, index) => (
            <ChatMessage key={index} {...message} />
          ))}
          {loading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-base-200">
                Thinking...
              </div>
            </div>
          )}
          {error && (
            <div className="flex justify-center">
              <div className="max-w-[80%] rounded-lg p-3 bg-error text-white">
                {error}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedModel ? "Type your message..." : "Please select a model first"}
              className="flex-1 input input-bordered"
              disabled={loading || !selectedModel}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !input.trim() || !selectedModel}
              title={!selectedModel ? "Please select a model first" : undefined}
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}