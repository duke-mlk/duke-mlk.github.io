import { useState } from 'react';

import type { User } from '../types';

interface OAuthProps {
  children: React.ReactNode;
  onAuthChange: (token: string, user: User) => void;
  isAuthenticated: boolean;
}

// Where viewers mint a token. A fine-grained PAT scoped to Contents: Read-only
// on duke-mlk/medical-flow is all the dashboard needs.
const TOKEN_SETUP_URL = 'https://github.com/settings/personal-access-tokens/new';

export function OAuth({ children, onAuthChange, isAuthenticated }: OAuthProps): React.ReactNode {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Verify the pasted token by reading the authenticated user straight from
  // api.github.com (CORS-enabled — no proxy, no backend). The repo-access gate
  // runs afterward in App via checkRepositoryAccess.
  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const token = tokenInput.trim();
    if (!token) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      if (res.status === 401) {
        setError('That token was rejected. Check it and try again.');
        return;
      }
      if (!res.ok) {
        setError(`GitHub returned ${res.status}. Try again.`);
        return;
      }
      const data = await res.json();
      const user: User = {
        login: data.login,
        name: data.name ?? data.login,
        avatar_url: data.avatar_url
      };
      onAuthChange(token, user);
    } catch {
      setError('Network error reaching GitHub. Check your connection.');
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    const skel = (h: string, w?: string): React.CSSProperties => ({
      background: '#e5e7eb',
      borderRadius: '6px',
      height: h,
      width: w
    });

    const card: React.CSSProperties = {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e5e7eb'
    };

    const sidebarItem = (active?: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 16px',
      borderRadius: '8px',
      background: active ? 'rgba(255,255,255,0.08)' : 'transparent'
    });

    return (
      <div style={{ minHeight: '100dvh' }}>
        {/* Blurred placeholder dashboard */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            filter: 'blur(6px)',
            opacity: 0.55,
            display: 'flex',
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          {/* Sidebar */}
          <div style={{
            width: '256px',
            flexShrink: 0,
            background: '#1a1a2e',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px 24px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0d9488' }} />
              <div>
                <div style={{ ...skel('12px', '90px'), background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ ...skel('9px', '70px'), background: 'rgba(255,255,255,0.15)', marginTop: '6px' }} />
              </div>
            </div>

            {/* Nav items */}
            {[true, false, false, false, false, false, false, false].map((active, i) => (
              <div key={i} style={sidebarItem(active)}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: active ? '#0d9488' : 'rgba(255,255,255,0.15)' }} />
                <div style={{ ...skel('11px', `${60 + (i % 3) * 20}px`), background: active ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }} />
              </div>
            ))}

            <div style={{ flex: 1 }} />

            {/* Sidebar footer */}
            <div style={{ padding: '12px 16px' }}>
              <div style={{ ...skel('9px', '110px'), background: 'rgba(255,255,255,0.1)', marginBottom: '6px' }} />
              <div style={{ ...skel('9px', '80px'), background: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, background: '#f5f5f0', height: '100vh', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              height: '64px',
              background: 'white',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px'
            }}>
              <div style={skel('18px', '120px')} />
            </div>

            {/* Filter bar */}
            <div style={{
              height: '48px',
              background: 'rgba(245,245,240,0.9)',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 24px'
            }}>
              {[80, 120, 120, 120, 160].map((w, i) => (
                <div key={i} style={{ ...skel('28px', `${w}px`), background: 'white', border: '1px solid #e5e7eb' }} />
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: '24px', overflow: 'hidden' }}>
              {/* Gradient banner */}
              <div style={{
                background: 'linear-gradient(135deg, #0d9488, #14b8a6, #0d9488)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px'
              }}>
                <div style={{ ...skel('16px', '280px'), background: 'rgba(255,255,255,0.35)', marginBottom: '10px' }} />
                <div style={{ ...skel('11px', '350px'), background: 'rgba(255,255,255,0.2)' }} />
              </div>

              {/* 3 metric cards */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                {[
                  { accent: '#dc2626' },
                  { accent: '#0d9488' },
                  { accent: '#6b7280' }
                ].map((c, i) => (
                  <div key={i} style={{ ...card, flex: 1, display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.accent + '18', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...skel('11px', '70%'), marginBottom: '10px' }} />
                      <div style={{ ...skel('24px', '45%') }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Donut chart + scatter */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ ...card, flex: 1 }}>
                  <div style={{ ...skel('14px', '55%'), marginBottom: '16px' }} />
                  <div style={{
                    width: '160px',
                    height: '160px',
                    borderRadius: '50%',
                    border: '20px solid #e5e7eb',
                    borderTopColor: '#dc2626',
                    borderRightColor: '#f59e0b',
                    margin: '12px auto'
                  }} />
                </div>
                <div style={{ ...card, flex: 1 }}>
                  <div style={{ ...skel('14px', '65%'), marginBottom: '16px' }} />
                  <div style={skel('180px')} />
                </div>
              </div>

              {/* 2-col charts */}
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ ...card, flex: 1 }}>
                  <div style={{ ...skel('14px', '50%'), marginBottom: '16px' }} />
                  <div style={skel('160px')} />
                </div>
                <div style={{ ...card, flex: 1 }}>
                  <div style={{ ...skel('14px', '45%'), marginBottom: '16px' }} />
                  <div style={skel('160px')} />
                </div>
              </div>

              {/* Table */}
              <div style={card}>
                <div style={{ ...skel('14px', '20%'), marginBottom: '16px' }} />
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '10px 0',
                    borderTop: i > 0 ? '1px solid #f3f4f6' : 'none'
                  }}>
                    <div style={{ ...skel('14px'), flex: 2 }} />
                    <div style={{ ...skel('14px'), flex: 1 }} />
                    <div style={{ ...skel('14px'), flex: 1 }} />
                    <div style={{ ...skel('14px', '50px') }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Login card */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100dvh',
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
                  Enter a GitHub access token to continue
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => { setTokenInput(e.target.value); setError(null); }}
                  placeholder="github_pat_…"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="GitHub access token"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
                    fontSize: '14px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    marginBottom: '12px'
                  }}
                />

                {error && (
                  <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 12px 0' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || !tokenInput.trim()}
                  style={{
                    width: '100%',
                    background: busy || !tokenInput.trim() ? '#94a3b8' : '#1E293B',
                    color: 'white',
                    fontWeight: '500',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: busy || !tokenInput.trim() ? 'default' : 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {busy ? 'Verifying…' : 'Continue'}
                </button>
              </form>

              <div style={{ marginTop: '20px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
                <a
                  href={TOKEN_SETUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0d9488', fontWeight: 500 }}
                >
                  Create a fine-grained token →
                </a>
                <div style={{ marginTop: '6px' }}>
                  Resource owner <strong>duke-mlk</strong> · repository{' '}
                  <strong>medical-flow</strong> · permission{' '}
                  <strong>Contents: Read-only</strong>. The token stays in your
                  browser and is sent only to GitHub.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
