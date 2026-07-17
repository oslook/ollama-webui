import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation, Message } from '../types';

interface AppState {
  // Conversations
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  appendMessage: (id: string, message: Message) => void;
  deleteConversation: (id: string) => void;

  // Currently selected conversation
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;

  // Ollama URL
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;

  // First visit flag
  hasVisited: boolean;
  setHasVisited: (visited: boolean) => void;

  // Whether to request the model's thinking/reasoning process
  thinkEnabled: boolean;
  setThinkEnabled: (enabled: boolean) => void;

  // Utility functions
  getCurrentConversation: (id: string | null) => Conversation | undefined;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Conversations
      conversations: [],
      setConversations: (conversations) => set({ conversations }),
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations]
        })),
      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, ...updates } : conv
          )
        })),
      appendMessage: (id, message) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: new Date().toISOString()
                }
              : conv
          )
        })),
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id)
        })),

      // Currently selected conversation
      currentConversationId: null,
      setCurrentConversationId: (id) => set({ currentConversationId: id }),

      // Ollama URL
      ollamaUrl: 'http://127.0.0.1:11434',
      setOllamaUrl: (url) => set({ ollamaUrl: url }),

      // First visit flag
      hasVisited: false,
      setHasVisited: (visited) => set({ hasVisited: visited }),

      // Thinking toggle (default on)
      thinkEnabled: true,
      setThinkEnabled: (enabled) => set({ thinkEnabled: enabled }),

      // Utility functions
      getCurrentConversation: (id) => {
        if (!id) return undefined;
        return get().conversations.find((conv) => conv.id === id);
      }
    }),
    {
      name: 'ollama-webui-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        ollamaUrl: state.ollamaUrl,
        hasVisited: state.hasVisited,
        thinkEnabled: state.thinkEnabled
      })
    }
  )
);