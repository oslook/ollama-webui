import { useState, useEffect, useRef } from 'react';
import { Cog6ToothIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Conversation } from '../types';

interface SettingsProps {
  onUrlChange: (url: string) => void;
  initialUrl: string;
  conversations: Conversation[];
  onConversationsImport: (conversations: Conversation[]) => void;
}

export default function Settings({ 
  onUrlChange, 
  initialUrl,
  conversations,
  onConversationsImport
}: SettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(initialUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const handleSave = () => {
    onUrlChange(url);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setUrl(initialUrl);
    setIsOpen(false);
  };

  const handleExport = () => {
    const data = JSON.stringify(conversations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ollama-chat-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content) as Conversation[];
        
        // 验证导入的数据格式
        if (!Array.isArray(imported) || !imported.every(isValidConversation)) {
          throw new Error('Invalid file format');
        }

        onConversationsImport(imported);
        setIsOpen(false);
      } catch (error) {
        alert('Failed to import conversations. Please make sure the file is valid.');
      }
    };
    reader.readAsText(file);
    
    // 清除文件输入，这样同一个文件可以再次选择
    event.target.value = '';
  };

  // 验证会话对象的格式
  const isValidConversation = (conv: any): conv is Conversation => {
    return (
      typeof conv === 'object' &&
      typeof conv.id === 'string' &&
      typeof conv.title === 'string' &&
      Array.isArray(conv.messages) &&
      typeof conv.model === 'string' &&
      typeof conv.createdAt === 'string' &&
      typeof conv.updatedAt === 'string'
    );
  };

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".json"
        onChange={handleFileChange}
      />
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle"
        title="Settings"
      >
        <Cog6ToothIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-base-100 rounded-lg shadow-lg p-4 border z-50">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Ollama Server URL</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input input-bordered w-full"
              placeholder="http://127.0.0.1:11434"
            />
          </div>

          <div className="divider my-2">Chat History</div>

          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={handleExport}
              className="btn btn-outline btn-sm gap-2"
              disabled={conversations.length === 0}
              title={conversations.length === 0 ? "No conversations to export" : "Export conversations"}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export Chat History
            </button>
            <button
              onClick={handleImport}
              className="btn btn-outline btn-sm gap-2"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Import Chat History
            </button>
          </div>

          <div className="divider my-2"></div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 