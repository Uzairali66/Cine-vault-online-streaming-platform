/**
 * Consistent page title block used across browse, detail, and genre pages.
 */
export function PageHeader({
  badge,
  title,
  description,
  align = 'left',
  className = '',
  titleClassName = '',
}) {
  const isCenter = align === 'center';

  return (
    <header className={`page-header ${isCenter ? 'page-header--center' : ''} ${className}`}>
      {badge && <div className="page-badge">{badge}</div>}
      {title && (
        <h1 className={`page-title ${isCenter ? 'page-title--center' : 'page-title--left'} ${titleClassName}`}>
          {title}
        </h1>
      )}
      {description && (
        <p className={`page-description ${isCenter ? 'text-center mx-auto' : ''}`}>{description}</p>
      )}
    </header>
  );
}

export default PageHeader;
