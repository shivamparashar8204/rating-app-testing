import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { RestaurantCard } from '../components/RestaurantCard';
import { ReviewCard } from '../components/ReviewCard';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Store } from '../types';

const INDIAN_RESTAURANTS = [
  {
    id: 1,
    name: "Aai's Kitchen",
    address: 'FC Road, Pune, Maharashtra',
    cuisine: 'Maharashtrian',
    rating: 4.7,
    reviewCount: 245,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
  },
  {
    id: 2,
    name: 'Shree Misal House',
    address: 'Dadar West, Mumbai, Maharashtra',
    cuisine: 'Maharashtrian',
    rating: 4.8,
    reviewCount: 312,
    image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=300&fit=crop',
  },
  {
    id: 3,
    name: 'Maharashtra Darbar',
    address: 'Nashik Road, Nashik, Maharashtra',
    cuisine: 'Maharashtrian',
    rating: 4.5,
    reviewCount: 178,
    image: 'https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=400&h=300&fit=crop',
  },
  {
    id: 4,
    name: 'Punjabi Zaika',
    address: 'Connaught Place, New Delhi',
    cuisine: 'North Indian',
    rating: 4.6,
    reviewCount: 289,
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=300&fit=crop',
  },
  {
    id: 5,
    name: 'Delhi Darbar',
    address: 'Karol Bagh, New Delhi',
    cuisine: 'North Indian',
    rating: 4.4,
    reviewCount: 203,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
  },
  {
    id: 6,
    name: 'Amritsari Rasoi',
    address: 'Lajpat Nagar, New Delhi',
    cuisine: 'Punjabi',
    rating: 4.8,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=300&fit=crop',
  },
];

const INDIAN_REVIEWS = [
  {
    id: 1,
    userName: 'Priya Sharma',
    date: '2 weeks ago',
    rating: 5,
    text: 'The Misal Pav at Aai\'s Kitchen is simply authentic! The spicy Kolhapuri tarri reminds me of my grandmother\'s cooking in Pune.',
  },
  {
    id: 2,
    userName: 'Rajesh Kumar',
    date: '3 weeks ago',
    rating: 4,
    text: 'Delhi Darbar\'s Butter Chicken is creamy and rich. Perfect with their garlic naan. A must-visit for North Indian food lovers!',
  },
  {
    id: 3,
    userName: 'Anjali Deshmukh',
    date: '1 month ago',
    rating: 5,
    text: 'Shree Misal House serves the best Fambra Misal in Mumbai! The poha and tarri are perfectly spiced. Highly recommended!',
  },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState(INDIAN_RESTAURANTS);
  const [showLoadMorePrompt, setShowLoadMorePrompt] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await api.get('/customer/stores');
        if (response.data.success && response.data.data) {
          const stores = response.data.data as Store[];
          if (stores.length > 0) {
            setRestaurants(
              stores.map((store, index) => ({
                id: store.id,
                name: store.name,
                address: store.address,
                cuisine: INDIAN_RESTAURANTS[index % INDIAN_RESTAURANTS.length].cuisine,
                rating: store.avg_rating || 0,
                reviewCount: Math.floor(Math.random() * 100) + 10,
                image: INDIAN_RESTAURANTS[index % INDIAN_RESTAURANTS.length].image,
              }))
            );
          }
        }
      } catch {
        // Use Indian restaurant data on error
      }
    };

    if (isAuthenticated) {
      fetchStores();
    }
  }, [isAuthenticated]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoadMore = () => {
    if (!isAuthenticated) {
      setShowLoadMorePrompt(true);
    }
  };

  return (
    <div className="landing-page">
      <Navbar onSearch={handleSearch} />

      <section className="hero">
        <div className="hero-content">
          <h1>
            Discover Indian Restaurants & See What{' '}
            <span className="hero-highlight">People Are Saying</span>
          </h1>
          <p className="hero-subtitle">
            Explore authentic Maharashtrian, North Indian and Punjabi cuisines from our community.
          </p>
          <div className="hero-notice">
            🔒 Please log in or sign up to add or manage your reviews.
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            Log In / Sign Up
          </button>
        </div>
      </section>

      <section className="restaurants-section">
        <div className="section-container">
          <h2 className="section-title">Top Rated Restaurants</h2>
          <div className="restaurants-grid">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} {...restaurant} />
            ))}
          </div>
          {filteredRestaurants.length === 0 && (
            <p className="no-results">No restaurants found matching your search.</p>
          )}
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-container">
          <h2 className="section-title">Latest Reviews</h2>
          <div className="reviews-grid">
            {INDIAN_REVIEWS.map((review) => (
              <ReviewCard key={review.id} {...review} />
            ))}
          </div>

          {showLoadMorePrompt ? (
            <div className="load-more-prompt">
              <span className="prompt-icon">🔒</span>
              <p>Log in or sign up to see more reviews from food lovers across India.</p>
              <div className="prompt-buttons">
                <button className="btn btn-primary" onClick={() => navigate('/login')}>
                  Log In
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/signup')}>
                  Sign Up
                </button>
              </div>
            </div>
          ) : (
            <div className="load-more-container">
              <button className="btn btn-outline" onClick={handleLoadMore}>
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="footer-logo">★</span>
            <span>5 Star Reviews</span>
          </div>
          <p className="footer-text">© 2024 5 Star Reviews. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
