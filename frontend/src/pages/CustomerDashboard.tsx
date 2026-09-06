import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { ChangePassword } from '../components/ChangePassword';
import { customerApi, CustomerDashboardStore, CustomerDashboardData } from '../services/customerApi';
import { StarRating } from '../components/StarRating';

export function CustomerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<CustomerDashboardData | null>(null);
  const [stores, setStores] = useState<CustomerDashboardStore[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [ratingInput, setRatingInput] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submittingStoreId, setSubmittingStoreId] = useState<string | null>(null);

  const loadData = async (query?: string) => {
    try {
      setIsLoading(true);
      const [dashData, storeData] = await Promise.all([
        customerApi.getDashboard(),
        customerApi.getStores(query),
      ]);
      setDashboard(dashData);
      setStores(storeData);
      const input: Record<string, number> = {};
      storeData.forEach((store) => {
        input[store.id] = store.user_rating || 1;
      });
      setRatingInput(input);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load dashboard data' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => {
    loadData(search);
  };

  const handleSubmitRating = async (store: CustomerDashboardStore) => {
    const rating = ratingInput[store.id];
    if (!rating || rating < 1 || rating > 5) {
      setMessage({ type: 'error', text: 'Please select a rating between 1 and 5' });
      return;
    }
    setMessage(null);
    setSubmittingStoreId(store.id);
    try {
      if (store.user_rating != null) {
        if (!store.user_rating_id) {
          await customerApi.submitRating(store.id, rating);
          setMessage({ type: 'success', text: `Your rating for ${store.name} was submitted` });
        } else {
          await customerApi.updateRating(store.user_rating_id, rating);
          setMessage({ type: 'success', text: `Your rating for ${store.name} was updated` });
        }
      } else {
        await customerApi.submitRating(store.id, rating);
        setMessage({ type: 'success', text: `Your rating for ${store.name} was submitted` });
      }
      loadData(search);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: apiError.response?.data?.message || 'Failed to submit rating' });
    } finally {
      setSubmittingStoreId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (isLoading && !dashboard) {
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

        {/* Header */}
        <div className="dashboard-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 4 }}>
              Welcome, {dashboard?.profile?.name || user?.name || 'Customer'}
            </h1>
            <p style={{ color: 'var(--gray-500)' }}>
              Search stores, rate them, and manage your ratings below.
            </p>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {message && (
          <div
            className={message.type === 'success' ? 'auth-success' : 'auth-error'}
            style={{ marginBottom: 16 }}
          >
            {message.text}
          </div>
        )}

        {/* Summary Cards */}
        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">⭐</div>
            <div className="admin-stat-info">
              <span className="admin-stat-number">{dashboard?.totalRatings ?? 0}</span>
              <span className="admin-stat-label">Total Ratings</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">📊</div>
            <div className="admin-stat-info">
              <span className="admin-stat-number">
                {dashboard?.avgRatingGiven != null ? dashboard.avgRatingGiven.toFixed(1) : '—'}
              </span>
              <span className="admin-stat-label">Average Rating Given</span>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-icon">🏬</div>
            <div className="admin-stat-info">
              <span className="admin-stat-number">{dashboard?.totalStores ?? 0}</span>
              <span className="admin-stat-label">Available Stores</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="admin-filters" style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search restaurants or stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="admin-search-input"
            style={{ width: '100%', maxWidth: 420 }}
          />
          <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
        </div>

        {/* Store List */}
        {isLoading ? (
          <div className="admin-loading">Loading stores...</div>
        ) : stores.length === 0 ? (
          <div className="admin-empty-state">No stores found</div>
        ) : (
          <div className="admin-table-container" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: 720 }}>
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Address</th>
                  <th>Rating</th>
                  <th>Your Rating</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <div>
                        <strong>{store.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{store.email}</div>
                      </div>
                    </td>
                    <td>{store.address}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <StarRating rating={Number(store.avg_rating) || 0} size="sm" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                          ({store.total_ratings || 0})
                        </span>
                      </div>
                    </td>
                    <td>
                      {store.user_rating != null ? (
                        <span className="rating-number">{store.user_rating}★</span>
                      ) : (
                        <span style={{ color: 'var(--gray-500)' }}>Not rated</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <select
                          value={ratingInput[store.id] || 1}
                          onChange={(e) =>
                            setRatingInput((prev) => ({ ...prev, [store.id]: Number(e.target.value) }))
                          }
                          className="role-select"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSubmitRating(store)}
                          disabled={submittingStoreId === store.id}
                        >
                          {submittingStoreId === store.id ? '...' : store.user_rating != null ? 'Update' : 'Rate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* My Ratings */}
        {dashboard && dashboard.recentRatings.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>My Recent Ratings</h2>
            <div className="admin-recent-list">
              {dashboard.recentRatings.map((rating) => (
                <div key={rating.id} className="admin-recent-item">
                  <div className="admin-recent-item-info">
                    <h4>{rating.user_name || 'You'}</h4>
                    <p>Rating ID: {rating.id}</p>
                  </div>
                  <div className="admin-recent-item-right" style={{ textAlign: 'right' }}>
                    <span className="admin-rating-badge">{'★'.repeat(rating.rating)}</span>
                    <div className="admin-date" style={{ marginTop: 4 }}>
                      {new Date(rating.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change Password */}
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
