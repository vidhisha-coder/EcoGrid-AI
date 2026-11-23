import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Map,
  FileText,
  PlusCircle,
  BarChart2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { to: '/map', label: 'Map View', icon: <Map size={18} /> },
    { to: '/reports', label: 'Reports', icon: <FileText size={18} /> },
    { to: '/reports/new', label: 'Submit Report', icon: <PlusCircle size={18} /> },
    { to: '/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
    ...(user?.role === 'authority'
      ? [{ to: '/admin/users', label: 'User Management', icon: <Users size={18} /> }]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${isActive(link.to) ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
