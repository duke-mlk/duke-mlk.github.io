import { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { CollaboratorsPanel } from './CollaboratorsPanel';

interface UserMenuProps {
  user: User | null;
  onLogout: () => void;
  token: string | null;
  userPermission: 'admin' | 'write' | 'read' | null;
}

export function UserMenu({ user, onLogout, token, userPermission }: UserMenuProps): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
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

    // Close when clicking inside the iframe (window loses focus)
    function handleBlur(): void {
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isOpen]);

  if (!user) return null;

  const menuItems = [
    {
      label: 'Refresh',
      ariaLabel: 'Refresh page',
      onClick: () => window.location.reload(),
      color: '#374151',
      hoverBg: '#f9fafb',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      )
    },
    {
      label: 'Collaborators',
      ariaLabel: 'Manage collaborators',
      onClick: () => { setIsOpen(false); setShowCollaborators(true); },
      color: '#374151',
      hoverBg: '#f9fafb',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      label: 'Logout',
      ariaLabel: 'Log out',
      onClick: onLogout,
      color: '#dc2626',
      hoverBg: '#fef2f2',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      )
    }
  ];

  return (
    <>
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
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={item.onClick}
              aria-label={item.ariaLabel}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                background: 'transparent',
                border: 'none',
                borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: item.color
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = item.hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {token && (
        <CollaboratorsPanel
          isOpen={showCollaborators}
          onClose={() => setShowCollaborators(false)}
          token={token}
          currentUser={user.login}
          isAdmin={userPermission === 'admin'}
        />
      )}
    </>
  );
}
