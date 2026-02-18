import { useEffect, useRef } from 'react';

import type { User } from '../types';

interface OAuthProps {
  children: React.ReactNode;
  clientId: string;
  proxyUrl: string;
  onAuthChange: (token: string, user: User) => void;
  isAuthenticated: boolean;
}

async function fetchUser(token: string): Promise<User> {
  const res = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
  });
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}

function getRedirectUri(): string {
  return window.location.origin + window.location.pathname;
}

export function OAuth({ children, clientId, proxyUrl, onAuthChange, isAuthenticated }: OAuthProps) {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');

    if (!code || !returnedState) return;
    handled.current = true;

    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');
    window.history.replaceState({}, '', window.location.pathname);

    if (returnedState !== storedState) return;

    async function exchangeToken() {
      const res = await fetch(`${proxyUrl}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, code, redirect_uri: getRedirectUri() })
      });
      const data = await res.json();
      if (data.error || !data.access_token) throw new Error(data.error_description || data.error);
      const user = await fetchUser(data.access_token);
      onAuthChange(data.access_token, user);
    }

    exchangeToken().catch((err) => console.error('OAuth token exchange failed:', err));
  }, [clientId, proxyUrl, onAuthChange]);

  function handleLogin() {
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: getRedirectUri(),
      scope: 'repo',
      state,
    });

    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  }

  if (!isAuthenticated) {
    const skeletonBlock = (height: string): React.CSSProperties => ({
      background: '#e5e7eb',
      borderRadius: '8px',
      height
    });

    return (
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Blurred placeholder dashboard */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            filter: 'blur(12px)',
            opacity: 0.6,
            background: '#fafaf8',
            padding: '24px',
            pointerEvents: 'none'
          }}
        >
          {/* Nav bar skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <div style={{ ...skeletonBlock('28px'), width: '140px' }} />
            <div style={{ flex: 1 }} />
            <div style={{ ...skeletonBlock('20px'), width: '80px' }} />
            <div style={{ ...skeletonBlock('20px'), width: '80px' }} />
            <div style={{ ...skeletonBlock('20px'), width: '80px' }} />
          </div>

          {/* Stat cards row */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                flex: 1,
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ ...skeletonBlock('14px'), width: '60%', marginBottom: '12px' }} />
                <div style={{ ...skeletonBlock('32px'), width: '40%' }} />
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '28px' }}>
            <div style={{
              flex: 2,
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ ...skeletonBlock('16px'), width: '30%', marginBottom: '20px' }} />
              <div style={skeletonBlock('200px')} />
            </div>
            <div style={{
              flex: 1,
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ ...skeletonBlock('16px'), width: '50%', marginBottom: '20px' }} />
              <div style={skeletonBlock('200px')} />
            </div>
          </div>

          {/* Table skeleton */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ ...skeletonBlock('16px'), width: '25%', marginBottom: '20px' }} />
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{
                display: 'flex',
                gap: '16px',
                padding: '12px 0',
                borderTop: i > 1 ? '1px solid #f3f4f6' : 'none'
              }}>
                <div style={{ ...skeletonBlock('16px'), flex: 2 }} />
                <div style={{ ...skeletonBlock('16px'), flex: 1 }} />
                <div style={{ ...skeletonBlock('16px'), flex: 1 }} />
                <div style={{ ...skeletonBlock('16px'), width: '60px' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{ maxWidth: '400px', width: '100%' }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '32px'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(to bottom right, #0D9488, #14B8A6)',
                  borderRadius: '16px',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                  </svg>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px 0' }}>
                  Medical Flow
                </h1>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  Authentication required
                </p>
              </div>

              <button
                onClick={handleLogin}
                style={{
                  width: '100%',
                  background: '#1E293B',
                  color: 'white',
                  fontWeight: '500',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#0F172A';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#1E293B';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Sign in with GitHub
              </button>

              <p style={{ fontSize: '12px', textAlign: 'center', color: '#9ca3af', marginTop: '16px' }}>
                Sign in to continue
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
