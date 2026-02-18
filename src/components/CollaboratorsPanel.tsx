import { useState, useEffect, useRef, useCallback } from 'react';
import type { Collaborator } from '../types';
import { fetchCollaborators, addCollaborator, removeCollaborator } from '../services/githubApi';

interface CollaboratorsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  currentUser: string;
  isAdmin: boolean;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#fef3c7', text: '#92400e' },
  write: { bg: '#dbeafe', text: '#1e40af' },
  read: { bg: '#f3f4f6', text: '#374151' }
};

function RoleBadge({ role }: { role: string }): JSX.Element {
  const colors = ROLE_COLORS[role] || ROLE_COLORS.read;
  return (
    <span style={{
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '2px 6px',
      borderRadius: '4px',
      background: colors.bg,
      color: colors.text
    }}>
      {role}
    </span>
  );
}

export function CollaboratorsPanel({ isOpen, onClose, token, currentUser, isAdmin }: CollaboratorsPanelProps): JSX.Element | null {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('pull');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [removingUser, setRemovingUser] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadCollaborators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCollaborators(token);
      setCollaborators(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadCollaborators();
    } else if (isOpen) {
      setLoading(false);
    }
  }, [isOpen, isAdmin, loadCollaborators]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  async function handleAdd(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) return;

    setAdding(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      const result = await addCollaborator(token, trimmed, role);
      setUsername('');
      setAddSuccess(
        result === 'invited'
          ? `Invitation sent to ${trimmed}`
          : `${trimmed} updated`
      );
      await loadCollaborators();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add collaborator');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(login: string): Promise<void> {
    setRemovingUser(login);
    try {
      await removeCollaborator(token, login);
      setCollaborators(prev => prev.filter(c => c.login !== login));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove collaborator');
    } finally {
      setRemovingUser(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(2px)'
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Collaborators"
        style={{
          position: 'relative',
          width: '380px',
          maxWidth: '100vw',
          height: '100dvh',
          background: '#fafaf8',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.2s ease-out'
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes slideIn {
              from { transform: translateX(0); }
              to { transform: translateX(0); }
            }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
            Collaborators
          </h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{
                width: '24px',
                height: '24px',
                border: '2px solid #e5e7eb',
                borderTopColor: '#6b7280',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#991b1b',
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              {error}
            </div>
          )}

          {!loading && !isAdmin && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 8px', fontWeight: 500 }}>
                Admin access required
              </p>
              <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                Only repository admins can view and manage collaborators
              </p>
            </div>
          )}

          {!loading && !error && isAdmin && collaborators.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
              No collaborators found
            </p>
          )}

          {!loading && collaborators.map(collab => (
            <div
              key={collab.login}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 0',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              <img
                src={collab.avatar_url}
                alt=""
                loading="lazy"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  objectFit: 'cover'
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#111827',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {collab.login}
                </div>
                <RoleBadge role={collab.role_name} />
              </div>

              {isAdmin && collab.login !== currentUser && (
                <button
                  onClick={() => handleRemove(collab.login)}
                  disabled={removingUser === collab.login}
                  aria-label={`Remove ${collab.login}`}
                  style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: removingUser === collab.login ? 'wait' : 'pointer',
                    color: '#9ca3af',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                    opacity: removingUser === collab.login ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (removingUser !== collab.login) {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.color = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add form (admin only) */}
        {isAdmin && (
          <form
            onSubmit={handleAdd}
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #e5e7eb',
              background: 'white'
            }}
          >
            {addSuccess && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#f0fdf4',
                color: '#166534',
                fontSize: '13px',
                marginBottom: '10px'
              }}>
                {addSuccess}
              </div>
            )}

            {addError && (
              <div style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: '#fef2f2',
                color: '#991b1b',
                fontSize: '13px',
                marginBottom: '10px'
              }}>
                {addError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="GitHub username"
                required
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  background: '#fafaf8',
                  minWidth: 0
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a5f'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                aria-label="Permission level"
                style={{
                  padding: '10px 8px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  background: '#fafaf8',
                  cursor: 'pointer'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1e3a5f'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
              >
                <option value="pull">Read</option>
                <option value="push">Write</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={adding || !username.trim()}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                fontWeight: 500,
                color: 'white',
                background: adding || !username.trim() ? '#9ca3af' : '#1e3a5f',
                border: 'none',
                borderRadius: '8px',
                cursor: adding || !username.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!adding && username.trim()) {
                  e.currentTarget.style.background = '#2c4f7c';
                }
              }}
              onMouseLeave={(e) => {
                if (!adding && username.trim()) {
                  e.currentTarget.style.background = '#1e3a5f';
                }
              }}
            >
              {adding ? 'Inviting...' : 'Invite collaborator'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
