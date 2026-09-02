import { StarRating } from './StarRating';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface RestaurantCardProps {
  id: number;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  image: string;
}

export function RestaurantCard({ id, name, address, rating, reviewCount, image }: RestaurantCardProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleRateClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  };

  return (
    <div className="restaurant-card">
      <div className="restaurant-card-image">
        <img src={image} alt={name} />
        <div className="restaurant-card-rating-badge">
          <StarRating rating={rating} size="sm" />
        </div>
      </div>
      <div className="restaurant-card-content">
        <h3 className="restaurant-card-name">{name}</h3>
        <p className="restaurant-card-address">📍 {address}</p>
        <div className="restaurant-card-stats">
          <span className="restaurant-card-reviews">{reviewCount} reviews</span>
        </div>
        {!isAuthenticated && (
          <button className="restaurant-card-rate-btn" onClick={handleRateClick}>
            🔒 Log in to rate
          </button>
        )}
      </div>
    </div>
  );
}
