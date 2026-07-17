import { useState, useEffect, useEffectEvent } from 'react';
import { Model } from '../types';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  baseUrl: string;
}

export default function ModelSelector({ selectedModel, onModelSelect, baseUrl }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reconcile the selection against a freshly fetched list without making the
  // fetch effect depend on `selectedModel`/`onModelSelect` (which would refetch
  // on every selection change). Effect Events always see the latest props.
  const reconcileSelection = useEffectEvent((modelList: Model[]) => {
    if (modelList.length > 0) {
      const modelNames = modelList.map((m) => m.name);
      if (!modelNames.includes(selectedModel)) {
        onModelSelect(modelList[0].name);
      }
    }
  });

  // Fetch the model list on mount and whenever the server URL changes.
  useEffect(() => {
    let cancelled = false;

    const fetchModels = async () => {
      try {
        setError(null);
        setLoading(true);
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        const modelList: Model[] = data.models || [];
        if (cancelled) return;
        setModels(modelList);
        reconcileSelection(modelList);
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching models:', error);
        setError('Failed to connect to Ollama server');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchModels();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  if (loading) {
    return <div className="loading loading-spinner loading-sm"></div>;
  }

  if (error) {
    return (
      <div className="text-error text-sm max-w-xs">
        <div>{error}</div>
        <div className="text-base-content/60 text-xs mt-1">
          If this app is hosted online, Ollama must allow cross-origin requests.
          On the Ollama host set{' '}
          <code className="bg-base-200 rounded px-1">OLLAMA_ORIGINS=*</code> and{' '}
          <code className="bg-base-200 rounded px-1">OLLAMA_HOST=0.0.0.0</code>,
          then restart it.{' '}
          <a
            href="https://docs.ollama.com/faq#how-can-i-allow-additional-web-origins-to-access-ollama"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            Learn more
          </a>
        </div>
      </div>
    );
  }

  return (
    <select
      className="select select-bordered w-full max-w-xs"
      value={selectedModel}
      onChange={(e) => onModelSelect(e.target.value)}
    >
      {models.length === 0 ? (
        <option value="">No models available</option>
      ) : (
        models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name}
          </option>
        ))
      )}
    </select>
  );
} 