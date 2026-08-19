import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, readOnly = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const displayValue = hover || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer transition-transform hover:scale-110'}
        >
          <Star
            className={SIZE_CLASSES[size]}
            fill={star <= displayValue ? '#F59E0B' : 'none'}
            stroke={star <= displayValue ? '#F59E0B' : '#D1D5DB'}
          />
        </button>
      ))}
    </div>
  );
};

export default StarRating;
