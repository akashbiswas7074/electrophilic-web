import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
}

const StarRating = ({
  rating,
  maxRating = 5,
  size = 16,
  color = "text-yellow-400",
  emptyColor = "text-gray-300"
}: StarRatingProps) => {
  // Ensure rating is between 0 and maxRating
  const normalizedRating = Math.max(0, Math.min(rating, maxRating));
  
  return (
    <div className="flex">
      {[...Array(maxRating)].map((_, i) => (
        <Star
          key={i}
          className={i < normalizedRating ? color : emptyColor}
          fill={i < normalizedRating ? "currentColor" : "none"}
          size={size}
        />
      ))}
    </div>
  );
};

export default StarRating;
