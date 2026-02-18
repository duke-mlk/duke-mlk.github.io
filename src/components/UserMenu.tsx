import { useState, useEffect, useRef } from 'react';
import type { User } from '../types';

interface UserMenuProps {
  user: User | null;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isExpanded = isHovered || isOpen;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <div ref={menuRef} style={{ position: 'fixed', top: '8px', right: '8px', zIndex: 50 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Open user menu"
        aria-expanded={isOpen}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: isExpanded ? 'white' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          border: '1px solid #e5e7eb',
          borderRadius: '9999px',
          padding: '4px',
          cursor: 'pointer',
          transition: 'all 0.3s ease-out',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          paddingRight: isExpanded ? '12px' : '4px'
        }}
      >
        <img
          src={user.avatar_url}
          alt={user.login}
          loading="lazy"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            flexShrink: 0,
            objectFit: 'cover'
          }}
        />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: isExpanded ? '150px' : '0',
            overflow: 'hidden',
            opacity: isExpanded ? 1 : 0,
            transition: 'all 0.3s ease-out',
            marginLeft: isExpanded ? '8px' : '0'
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#111827',
              whiteSpace: 'nowrap',
              lineHeight: '1.2'
            }}
          >
            {user.name || user.login}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#6b7280',
              whiteSpace: 'nowrap',
              lineHeight: '1.2'
            }}
          >
            @{user.login}
          </span>
        </div>
      </button>

      <div
        style={{
          position: 'absolute',
          top: '56px',
          right: '0',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          minWidth: '200px',
          overflow: 'hidden',
          transition: 'all 0.1s',
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          transform: isOpen ? 'translateY(0)' : 'translateY(-8px)'
        }}
      >
        <button
          onClick={() => window.location.reload()}
          aria-label="Refresh page"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#374151',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Refresh
        </button>

        <button
          onClick={onLogout}
          aria-label="Log out"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#dc2626',
            background: 'transparent',
            border: 'none',
            borderTop: '1px solid #f3f4f6',
            cursor: 'pointer',
            transition: 'background-color 0.15s',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
}
