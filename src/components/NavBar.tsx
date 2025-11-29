import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const linkBaseStyle: React.CSSProperties = {
  padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2.5vw, 14px)',
  borderRadius: 10,
  fontWeight: 700,
  fontSize: 'clamp(13px, 2.5vw, 14px)',
  textDecoration: 'none',
  transition: 'all 200ms ease',
};

const NavBar: React.FC = () => {
  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)',
        background: 'rgba(2, 6, 23, 0.65)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        width: '100%',
        left: 0,
        right: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px var(--page-gutter)',
          width: '100%',
          boxSizing: 'border-box',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#e5e7eb',
            textDecoration: 'none',
            fontWeight: 800,
            letterSpacing: 0.3,
          }}
        >
          <span style={{ fontSize: 'clamp(16px, 3vw, 18px)' }}>🚀</span>
          <span style={{ fontSize: 'clamp(14px, 2.5vw, 16px)' }}>Forex AI Trader</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              ...linkBaseStyle,
              color: isActive ? '#10b981' : '#e5e7eb',
              background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent',
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              ...linkBaseStyle,
              color: isActive ? '#10b981' : '#e5e7eb',
              background: isActive ? 'rgba(16,185,129,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(16,185,129,0.35)' : '1px solid transparent',
            })}
          >
            Performance
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;


