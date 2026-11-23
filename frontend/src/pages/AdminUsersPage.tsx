import React, { useEffect, useState } from 'react';
import { usersApi } from '../services/api';
import { User } from '../types';
import { Loader, Users, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    usersApi.getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId: number, role: string) => {
    setUpdatingId(userId);
    try {
      const updated = await usersApi.updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success('Role updated!');
    } catch {
      toast.error('Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-center full-height">
        <Loader size={28} className="spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <Users size={22} /> User Management
          </h2>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Active</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar-sm">{u.username[0]?.toUpperCase()}</div>
                    {u.username}
                  </div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>
                  {u.is_active ? (
                    <CheckCircle size={16} className="text-green" />
                  ) : (
                    <XCircle size={16} className="text-red" />
                  )}
                </td>
                <td>{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                <td>
                  <div className="role-change-cell">
                    <select
                      className="form-input role-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={updatingId === u.id}
                    >
                      <option value="citizen">Citizen</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="authority">Authority</option>
                    </select>
                    {updatingId === u.id && <Loader size={14} className="spin" />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">👤</span>
          <p>No users found.</p>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
