import { Link, useNavigate } from 'react-router-dom';

/**
 * Consistent back navigation — browser history or explicit route.
 */
export function BackLink({ to, label = 'Back', className = '' }) {
  const navigate = useNavigate();

  const classes = `back-link ${className}`;

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => navigate(-1)} className={classes}>
      {icon}
      {label}
    </button>
  );
}

export default BackLink;
