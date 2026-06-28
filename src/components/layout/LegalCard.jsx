import BackLink from './BackLink';

/**
 * Shared layout for legal / static content pages.
 */
export function LegalCard({ title, backTo = '/', backLabel = 'Back to Home', children }) {
  return (
    <>
      <BackLink to={backTo} label={backLabel} className="mb-8" />
      <article className="legal-card">
        <h1 className="legal-card__title">{title}</h1>
        {children}
      </article>
    </>
  );
}

export default LegalCard;
