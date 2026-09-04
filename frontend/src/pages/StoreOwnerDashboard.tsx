import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChangePassword } from '../components/ChangePassword';
import { storeOwnerApi } from '../services/customerApi';
import { StarRating } from '../components/StarRating';
import { Rating } from '../types';

interface DashboardData {
  store: { id: string; name: string; email: string; address: string };
  averageRating: number | null;
  totalRatings: number;
}

export function StoreOwnerDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, ratingData] = await Promise.all([
          storeOwnerApi.getDashboard(),
          storeOwnerApi.getRatings(),
        ]);
        setDashboard(dash);
        setRatings(ratingData);
      } catch (err: unknown) {
        console.error('Failed to load store owner dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="landing-page">
        <Navbar />
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
        <div className="dashboard-header" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Store Owner Dashboard</h1>
          <p style={{ color: 'var(--gray-500)' }}>View your store's performance and who rated it.</p>
        </div>

        {!dashboard ? (
          <div className="admin-empty-state" style={{ padding: 40, textAlign: 'center' }}>
            No store is assigned to your account yet. Contact an administrator.
          </div>
        ) : (
          <>
            <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">🏬</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-number">{dashboard.store.name}</span>
                  <span className="admin-stat-label">Store Name</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">⭐</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-number">
                    {dashboard.averageRating != null ? dashboard.averageRating.toFixed(1) : '—'}
                  </span>
                  <span className="admin-stat-label">Average Rating</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">👥</div>
                <div className="admin-stat-info">
                  <span className="admin-stat-number">{dashboard.totalRatings}</span>
                  <span className="admin-stat-label">Total Ratings</span>
                </div>
              </div>
            </div>

            <div className="admin-dashboard-section" style={{ marginBottom: 24 }}>
              <div className="admin-section-header">
                <h3>Your Store</h3>
              </div>
              <div className="admin-section-content">
                <div className="admin-list-item">
                  <div className="admin-list-item-main">
                    <span className="admin-list-item-title">{dashboard.store.name}</span>
                    <span className="admin-list-item-subtitle">{dashboard.store.email}</span>
                    <span className="admin-list-item-subtitle">📍 {dashboard.store.address}</span>
                  </div>
                  <div className="admin-list-item-right">
                    <StarRating rating={Number(dashboard.averageRating) || 0} size="sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-dashboard-section" style={{ marginBottom: 24 }}>
              <div className="admin-section-header">
                <h3>Users Who Rated Your Store</h3>
              </div>
              <div className="admin-section-content">
                {ratings.length === 0 ? (
                  <p className="admin-empty">No ratings yet</p>
                ) : (
                  ratings.map((rating) => (
                    <div key={rating.id} className="admin-list-item">
                      <div className="admin-list-item-main">
                        <span className="admin-list-item-title">{rating.user_name}</span>
                        <span className="admin-list-item-subtitle">{rating.user_email}</span>
                      </div>
                      <div className="admin-list-item-right">
                        <span className="admin-rating-badge">{'★'.repeat(rating.rating)}</span>
                        <span className="admin-date">{new Date(rating.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 32 }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? 'Hide' : 'Change'} Password
          </button>
          {showPassword && <div style={{ marginTop: 16 }}><ChangePassword /></div>}
        </div>
      </div>
    </div>
  );
}
