import { useCallback, useEffect, useState } from 'react';

import { LoadingSpinner } from './LoadingSpinner';
import { fetchFileContent } from '../services/githubApi';
import { processProxyHtml } from '../services/htmlProcessor';

interface ProxyProps {
  token: string;
}

export function Proxy({ token }: ProxyProps): JSX.Element {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');

  const fetchContent = useCallback((path: string) => {
    return fetchFileContent(path, token);
  }, [token]);

  useEffect(() => {
    async function loadDashboard(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const html = await fetchContent('index.html');
        const fullHtml = await processProxyHtml(html, {
          token,
          fetchContent
        });

        const blob = new Blob([fullHtml], { type: 'text/html' });
        setBlobUrl(URL.createObjectURL(blob));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [fetchContent, token]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)'
      }}>
        <p style={{ color: '#dc2626' }}>{error}</p>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none'
      }}
      title="Dashboard"
    />
  );
}
