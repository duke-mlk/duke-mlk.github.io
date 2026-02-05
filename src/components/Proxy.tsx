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
  const [iframeSrc, setIframeSrc] = useState('');

  const fetchContent = useCallback((path: string) => {
    return fetchFileContent(path, token);
  }, [token]);

  useEffect(() => {
    async function loadDashboard(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const reg = await navigator.serviceWorker.ready;

        // Send token first so the SW can authenticate proxied requests
        reg.active?.postMessage({ type: 'SET_TOKEN', token });

        const html = await fetchContent('index.html');
        const fullHtml = await processProxyHtml(html, { fetchContent });

        // Send HTML to SW and wait for acknowledgement before mounting
        // the iframe, so /__app__ is ready to serve immediately
        await new Promise<void>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = () => resolve();
          reg.active?.postMessage({ type: 'SET_APP_CONTENT', html: fullHtml }, [channel.port2]);
        });

        // Point the iframe at the SW-controlled URL rather than a blob URL.
        // This makes the iframe same-origin with the SW so all its resource
        // loads (images, data fetches) are intercepted and proxied.
        setIframeSrc('/__app__');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [fetchContent, token]);

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
      src={iframeSrc}
      style={{ width: '100%', height: '100vh', border: 'none' }}
      title="Dashboard"
    />
  );
}
