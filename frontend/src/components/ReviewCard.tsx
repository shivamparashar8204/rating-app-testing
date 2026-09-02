import { StarRating } from './StarRating';

interface ReviewCardProps {
  userName: string;
  date: string;
  rating: number;
  text: string;
}

export function ReviewCard({ userName, date, rating, text }: ReviewCardProps) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-card-avatar">{initials}</div>
        <div className="review-card-info">
          <h4 className="review-card-name">{userName}</h4>
          <span className="review-card-date">{date}</span>
        </div>
      </div>
      <div className="review-card-rating">
        <StarRating rating={rating} size="sm" />
      </div>
      <p className="review-card-text">"{text}"</p>
    </div>
  );
}
