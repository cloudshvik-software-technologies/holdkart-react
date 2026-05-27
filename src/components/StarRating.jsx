export default function StarRating({ rating, size = '1rem' }) {
    return (
      <div className="stars">
        {[1,2,3,4,5].map(i => (
          <span key={i} className={`star ${i <= Math.round(rating) ? '' : 'empty'}`} style={{ fontSize: size }}>★</span>
        ))}
      </div>
    );
  }
  