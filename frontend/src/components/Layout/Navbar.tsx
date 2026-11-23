import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Leaf,
  Map,
  FileText,
  PlusCircle,
  BarChart2,
  Users,
  LogOut,
  Menu,
  X,
  Home,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!isAuthenticated) return null;

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={16} /> },
    { to: '/map', label: 'Map', icon: <Map size={16} /> },
    { to: '/reports', label: 'Reports', icon: <FileText size={16} /> },
    { to: '/reports/new', label: 'New Report', icon: <PlusCircle size={16} /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart2 size={16} /> },
    ...(user?.role === 'authority'
      ? [{ to: '/admin/users', label: 'Users', icon: <Users size={16} /> }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <Leaf size={24} className="brand-icon" />
          <span className="brand-text">EcoGrid AI</span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-links desktop-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link ${isActive(link.to) ? 'active' : ''}`}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* User dropdown */}
        <div className="user-area">
          <div className="user-dropdown" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <span className="username">{user?.username}</span>
            <ChevronDown size={14} />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-info">
                  <span className="dropdown-name">{user?.username}</span>
                  <span className="dropdown-role">{user?.role}</span>
                </div>
                <button
                  className="dropdown-item logout-btn"
                  onClick={() => { logout(); setDropdownOpen(false); }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`mobile-nav-link ${isActive(link.to) ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            className="mobile-nav-link logout-btn"
            onClick={() => { logout(); setMobileOpen(false); }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
