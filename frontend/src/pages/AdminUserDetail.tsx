import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { AdminUserWithStore } from '../types';

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserWithStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await adminApi.getUserById(id);
        setUser(data);
      } catch (err: unknown) {
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(apiError.response?.data?.message || 'Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  if (isLoading) {
    return <div className="admin-loading">Loading user details...</div>;
  }

  if (error || !user) {
    return (
      <div className="admin-page">
        <div className="admin-empty-state">{error || 'User not found'}</div>
        <button className="btn btn-outline" onClick={() => navigate('/admin/users')}>Back</button>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    ADMIN: 'System Administrator',
    CUSTOMER: 'Customer',
    STORE_OWNER: 'Store Owner',
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2>User Details</h2>
        <button className="btn btn-outline" onClick={() => navigate('/admin/users')}>Back to Users</button>
      </div>

      <div className="admin-detail-card" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-md)' }}>
        <div className="admin-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <span className="admin-detail-label" style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Name</span>
            <div style={{ fontWeight: 600 }}>{user.name}</div>
          </div>
          <div>
            <span className="admin-detail-label" style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Email</span>
            <div>{user.email}</div>
          </div>
          <div>
            <span className="admin-detail-label" style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Address</span>
            <div>{user.address || '-'}</div>
          </div>
          <div>
            <span className="admin-detail-label" style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Role</span>
            <div>{roleLabels[user.role] || user.role}</div>
          </div>
          <div>
            <span className="admin-detail-label" style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>Registered</span>
            <div>{new Date(user.created_at).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {user.role === 'STORE_OWNER' && (
        <div className="admin-dashboard-section" style={{ marginTop: 24 }}>
          <div className="admin-section-header">
            <h3>Store & Rating</h3>
          </div>
          <div className="admin-section-content">
            {user.store ? (
              <div className="admin-list-item">
                <div className="admin-list-item-main">
                  <span className="admin-list-item-title">{user.store.name}</span>
                  <span className="admin-list-item-subtitle">{user.store.email}</span>
                  <span className="admin-list-item-subtitle">📍 {user.store.address}</span>
                </div>
                <div className="admin-list-item-right">
                  <span className="admin-rating-number">
                    {user.avg_rating != null ? user.avg_rating.toFixed(1) : '—'}
                  </span>
                  <span className="admin-rating-count">({user.total_ratings || 0} ratings)</span>
                </div>
              </div>
            ) : (
              <p className="admin-empty">No store assigned to this owner</p>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
      </div>
    </div>
  );
}
