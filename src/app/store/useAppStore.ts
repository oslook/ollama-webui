import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation } from '../types';

interface AppState {
  // Conversations
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  // Ollama URL
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;

  // First visit flag
  hasVisited: boolean;
  setHasVisited: (visited: boolean) => void;

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
      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== id)
        })),

      // Ollama URL
      ollamaUrl: 'http://127.0.0.1:11434',
      setOllamaUrl: (url) => set({ ollamaUrl: url }),

      // First visit flag
      hasVisited: false,
      setHasVisited: (visited) => set({ hasVisited: visited }),

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
        hasVisited: state.hasVisited
      })
    }
  )
);