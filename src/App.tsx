import { useCallback, useEffect, useState } from 'react';

import { config } from './config';
import { LoadingSpinner } from './components/LoadingSpinner';
import { OAuth } from './components/OAuth';
import { Proxy } from './components/Proxy';
import { UserMenu } from './components/UserMenu';
import { useAuthStore } from './store/authStore';
import { checkRepositoryAccess, TOKEN_EXPIRED } from './services/githubApi';

interface AccessDeniedProps {
  onLogout: () => void;
}

function AccessDenied({ onLogout }: AccessDeniedProps): JSX.Element {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f9fafb, #e5e7eb)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)',
            borderRadius: '16px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg style={{ width: '32px', height: '32px', color: '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px 0' }}>
            Access Required
          </h2>

          <p style={{ color: '#6b7280', marginBottom: '24px', lineHeight: '1.6', fontSize: '15px' }}>
            You need access to <strong style={{ color: '#374151' }}>{config.repository.owner}/{config.repository.name}</strong> to continue
          </p>

          <p style={{ color: '#9ca3af', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>
            Contact the repository administrator to request access, then sign in again
          </p>

          <button
            onClick={onLogout}
            style={{
              width: '100%',
              background: 'linear-gradient(to right, #1e3a5f, #2c4f7c)',
              color: 'white',
              fontWeight: '500',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  const { isAuthenticated, token, user, setAuth, logout } = useAuthStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      const path = redirect.replace(/~and~/g, '&').replace(/~eq~/g, '=');
      window.history.replaceState(null, '', window.location.pathname + path);
    }
  }, []);

  const checkRepoAccess = useCallback(async (accessToken: string): Promise<void> => {
    setIsChecking(true);

    try {
      await checkRepositoryAccess(accessToken);
      setHasAccess(true);
    } catch (error) {
      if (error instanceof Error && error.message === TOKEN_EXPIRED) {
        console.warn('Token expired or invalid, logging out');
        logout();
        return;
      }
      console.error('Failed to check repo access:', error);
      setHasAccess(false);
    } finally {
      setIsChecking(false);
    }
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated && token) {
      checkRepoAccess(token);
    } else {
      setIsChecking(false);
    }
  }, [isAuthenticated, token, checkRepoAccess]);

  if (isChecking) {
    return <LoadingSpinner message="Checking access..." />;
  }

  return (
    <OAuth
      clientId={config.oauth.clientId}
      proxyUrl={config.oauth.proxyUrl}
      onAuthChange={setAuth}
      isAuthenticated={isAuthenticated}
    >
      {hasAccess && (
        <>
          <UserMenu user={user} onLogout={logout} />
          <Proxy token={token!} />
        </>
      )}
      {hasAccess === false && <AccessDenied onLogout={logout} />}
    </OAuth>
  );
}

export default App;
