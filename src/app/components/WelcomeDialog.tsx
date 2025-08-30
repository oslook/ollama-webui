import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-base-content">Welcome to Ollama Chat</h2>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-base-content/90">
              <div>
                <h3 className="font-semibold mb-2">How to use:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>First, ensure Ollama is installed and running locally</li>
                  <li>Select an available model from the model selector</li>
                  <li>Type your question in the input box and send</li>
                  <li>Supports multi-turn conversations and session management</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Start Ollama:</h3>
                <div className="bg-base-200 rounded p-3 text-sm font-mono">
                  ollama serve
                </div>
                <p className="text-xs mt-1 text-base-content/70">
                  Make sure Ollama is running locally, default address: http://127.0.0.1:11434
                </p>
              </div>

              <div className="bg-info/10 border border-info/20 rounded p-3">
                <p className="text-sm">
                  <strong>Privacy Protection:</strong> This tool runs completely locally. All conversation data is stored only on your device and is not uploaded to any server.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="btn btn-primary">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Bottom right help button component
export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 btn btn-circle btn-primary shadow-lg z-30"
      title="Help"
    >
      <QuestionMarkCircleIcon className="w-6 h-6" />
    </button>
  );
}