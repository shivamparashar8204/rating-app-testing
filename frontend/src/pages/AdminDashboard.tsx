import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { DashboardData, AdminRatingDetail, AdminStoreDetail, AdminUserDetail } from '../types';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [recentReviews, setRecentReviews] = useState<AdminRatingDetail[]>([]);
  const [topStores, setTopStores] = useState<AdminStoreDetail[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<AdminUserDetail[]>([]);
  const [recentStores, setRecentStores] = useState<AdminStoreDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsData, reviewsData, topStoresData, customersData, storesData] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getRecentReviews(),
        adminApi.getTopRatedStores(),
        adminApi.getRecentlyRegisteredCustomers(),
        adminApi.getRecentlyAddedStores(),
      ]);
      setStats(statsData);
      setRecentReviews(reviewsData);
      setTopStores(topStoresData);
      setRecentCustomers(customersData);
      setRecentStores(storesData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <div className="admin-stat-card" onClick={() => navigate('/admin/customers')}>
          <div className="admin-stat-icon">👤</div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats?.total_customers || 0}</span>
            <span className="admin-stat-label">Customers</span>
          </div>
        </div>
        <div className="admin-stat-card" onClick={() => navigate('/admin/store-owners')}>
          <div className="admin-stat-icon">🏪</div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats?.total_store_owners || 0}</span>
            <span className="admin-stat-label">Store Owners</span>
          </div>
        </div>
        <div className="admin-stat-card" onClick={() => navigate('/admin/stores')}>
          <div className="admin-stat-icon">🏬</div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats?.total_stores || 0}</span>
            <span className="admin-stat-label">Stores</span>
          </div>
        </div>
        <div className="admin-stat-card" onClick={() => navigate('/admin/reviews')}>
          <div className="admin-stat-icon">⭐</div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats?.total_ratings || 0}</span>
            <span className="admin-stat-label">Reviews</span>
          </div>
        </div>
        <div className="admin-stat-card admin-stat-highlight">
          <div className="admin-stat-icon">📈</div>
          <div className="admin-stat-info">
            <span className="admin-stat-number">{stats?.avg_rating || 0}</span>
            <span className="admin-stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h3>Recent Reviews</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/reviews')}>View All</button>
          </div>
          <div className="admin-section-content">
            {recentReviews.length === 0 ? (
              <p className="admin-empty">No reviews yet</p>
            ) : (
              recentReviews.map((review) => (
                <div key={review.id} className="admin-list-item">
                  <div className="admin-list-item-main">
                    <span className="admin-list-item-title">{review.user_name}</span>
                    <span className="admin-list-item-subtitle">rated {review.store_name}</span>
                  </div>
                  <div className="admin-list-item-right">
                    <span className="admin-rating-badge">{'★'.repeat(review.rating)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h3>Top Rated Stores</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/stores')}>View All</button>
          </div>
          <div className="admin-section-content">
            {topStores.length === 0 ? (
              <p className="admin-empty">No stores yet</p>
            ) : (
              topStores.map((store) => (
                <div key={store.id} className="admin-list-item">
                  <div className="admin-list-item-main">
                    <span className="admin-list-item-title">{store.name}</span>
                    <span className="admin-list-item-subtitle">{store.owner_name}</span>
                  </div>
                  <div className="admin-list-item-right">
                    <span className="admin-rating-number">{store.avg_rating}</span>
                    <span className="admin-rating-count">({store.total_ratings})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h3>Recently Registered Customers</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/customers')}>View All</button>
          </div>
          <div className="admin-section-content">
            {recentCustomers.length === 0 ? (
              <p className="admin-empty">No customers yet</p>
            ) : (
              recentCustomers.map((customer) => (
                <div key={customer.id} className="admin-list-item">
                  <div className="admin-list-item-main">
                    <span className="admin-list-item-title">{customer.name}</span>
                    <span className="admin-list-item-subtitle">{customer.email}</span>
                  </div>
                  <div className="admin-list-item-right">
                    <span className="admin-date">{new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-dashboard-section">
          <div className="admin-section-header">
            <h3>Recently Added Stores</h3>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/stores')}>View All</button>
          </div>
          <div className="admin-section-content">
            {recentStores.length === 0 ? (
              <p className="admin-empty">No stores yet</p>
            ) : (
              recentStores.map((store) => (
                <div key={store.id} className="admin-list-item">
                  <div className="admin-list-item-main">
                    <span className="admin-list-item-title">{store.name}</span>
                    <span className="admin-list-item-subtitle">{store.owner_name}</span>
                  </div>
                  <div className="admin-list-item-right">
                    <span className="admin-date">{new Date(store.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
