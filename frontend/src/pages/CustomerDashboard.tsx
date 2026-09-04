import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChangePassword } from '../components/ChangePassword';
import { customerApi, CustomerDashboardStore } from '../services/customerApi';
import { StarRating } from '../components/StarRating';

export function CustomerDashboard() {
  const [stores, setStores] = useState<CustomerDashboardStore[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [ratingInput, setRatingInput] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loadStores = async (query?: string) => {
    try {
      setIsLoading(true);
      const data = await customerApi.getStores(query);
      setStores(data);
      const input: Record<string, number> = {};
      data.forEach((store) => {
        input[store.id] = store.user_rating || 1;
      });
      setRatingInput(input);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load stores' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const handleSearch = () => {
    loadStores(search);
  };

  const handleSubmitRating = async (store: CustomerDashboardStore) => {
    const rating = ratingInput[store.id];
    if (!rating || rating < 1 || rating > 5) {
      setMessage({ type: 'error', text: 'Please select a rating between 1 and 5' });
      return;
    }
    setMessage(null);
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
      loadStores(search);
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setMessage({ type: 'error', text: apiError.response?.data?.message || 'Failed to submit rating' });
      loadStores(search);
    }
  };

  return (
    <div className="landing-page">
      <Navbar />
      <div className="dashboard-container" style={{ maxWidth: 960, margin: '0 auto', padding: 32 }}>
        <div className="dashboard-header" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, marginBottom: 4 }}>Customer Dashboard</h1>
          <p style={{ color: 'var(--gray-500)' }}>Search stores, rate them, and manage your ratings below.</p>
        </div>

        {message && (
          <div
            className={message.type === 'success' ? 'auth-success' : 'auth-error'}
            style={{ marginBottom: 16 }}
          >
            {message.text}
          </div>
        )}

        <div className="admin-filters" style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search stores by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="admin-search-input"
            style={{ width: '100%', maxWidth: 420 }}
          />
          <button className="btn btn-secondary" onClick={handleSearch}>Search</button>
        </div>

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
                  <th>Email</th>
                  <th>Address</th>
                  <th>Overall Rating</th>
                  <th>Your Rating</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>{store.name}</td>
                    <td>{store.email}</td>
                    <td>{store.address}</td>
                    <td>
                      <StarRating rating={Number(store.avg_rating) || 0} size="sm" />
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
                        <button className="btn btn-sm btn-primary" onClick={() => handleSubmitRating(store)}>
                          {store.user_rating != null ? 'Update' : 'Rate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
