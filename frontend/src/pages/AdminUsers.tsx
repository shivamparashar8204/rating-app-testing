import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { AdminUserDetail as AdminUser } from '../types';

export function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadUsers();
  }, [sortField, sortOrder]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {
        sortBy: sortField,
        order: sortOrder,
      };
      if (name) params.name = name;
      if (email) params.email = email;
      if (address) params.address = address;
      if (role) params.role = role;
      const data = await adminApi.getUsers(params);
      setUsers(data);
    } catch {
      setToast({ message: 'Failed to load users', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSearch = () => loadUsers();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortField(field);
      setSortOrder('ASC');
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: 'System Administrator',
    CUSTOMER: 'Customer',
    STORE_OWNER: 'Store Owner',
  };

  return (
    <div className="admin-page">
      {toast && <div className={`admin-toast admin-toast-${toast.type}`}>{toast.message}</div>}

      <div className="admin-page-header">
        <h2>Users</h2>
        <button className="btn btn-primary" onClick={() => navigate('/admin/customers')}>
          + Create User
        </button>
      </div>

      <div className="admin-filters">
        <input type="text" placeholder="Filter by name..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="admin-search-input" />
        <input type="text" placeholder="Filter by email..." value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="admin-search-input" />
        <input type="text" placeholder="Filter by address..." value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="admin-search-input" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="role-select" style={{ padding: '8px 12px' }}>
          <option value="">All Roles</option>
          <option value="ADMIN">System Administrator</option>
          <option value="CUSTOMER">Customer</option>
          <option value="STORE_OWNER">Store Owner</option>
        </select>
        <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
      </div>

      {isLoading ? (
        <div className="admin-loading">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="admin-empty-state">No users found</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {sortField === 'name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                  Email {sortField === 'email' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('address')} className="sortable">
                  Address {sortField === 'address' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('role')} className="sortable">
                  Role {sortField === 'role' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('created_at')} className="sortable">
                  Registered {sortField === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.address || '-'}</td>
                  <td>{roleLabels[user.role] || user.role}</td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
