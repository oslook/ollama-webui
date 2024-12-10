import { PlusIcon, ChatBubbleLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Conversation } from '../types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (conversation: Conversation) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({
  conversations,
  currentConversationId,
  onSelect,
  onNew,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="w-64 border-r bg-base-200 flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={onNew}
          className="btn btn-primary w-full gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-center gap-2 p-3 hover:bg-base-300 cursor-pointer ${
              conv.id === currentConversationId ? 'bg-base-300' : ''
            }`}
            onClick={() => onSelect(conv)}
          >
            <ChatBubbleLeftIcon className="h-5 w-5 shrink-0" />
            <div className="flex-1 truncate">
              <div className="font-medium truncate">{conv.title}</div>
              <div className="text-xs opacity-50">
                {new Date(conv.updatedAt).toLocaleString()}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              className="btn btn-ghost btn-xs"
              title="Delete conversation"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 