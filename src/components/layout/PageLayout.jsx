/**
 * Shared page layout shells — keeps spacing, width, and backgrounds consistent.
 *
 * Variants:
 * - default: pattern + wrapper (browse, detail, genre, legal)
 * - narrow: pattern + narrower wrapper (watch, contact)
 * - centered: vertically centered content (premium success, already premium)
 * - auth: centered auth forms with gradient backdrop
 * - hero: full-bleed landing (cancels main top padding)
 * - admin: full-width admin dashboard
 * - plain: no pattern, optional wrapper padding only
 */
const WIDTH = {
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export function PageLayout({
  variant = 'default',
  pattern = true,
  width = '7xl',
  className = '',
  wrapperClassName = '',
  children,
}) {
  const contentWidth = WIDTH[width] || WIDTH['7xl'];

  if (variant === 'hero') {
    return (
      <div className={`-mt-16 sm:-mt-20 min-h-screen bg-primary ${className}`}>
        {children}
      </div>
    );
  }

  if (variant === 'auth') {
    return (
      <div
        className={`relative flex min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] items-center justify-center px-4 sm:px-6 py-10 bg-gradient-to-b from-primary via-primary to-violet-900/10 ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md">{children}</div>
      </div>
    );
  }

  if (variant === 'centered') {
    return (
      <div
        className={`relative flex min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] items-center justify-center px-4 sm:px-6 py-10 ${className}`}
      >
        {pattern && <div className="pattern" aria-hidden="true" />}
        <div className={`relative z-10 w-full ${contentWidth} mx-auto`}>{children}</div>
      </div>
    );
  }

  if (variant === 'admin') {
    return (
      <div className={`relative bg-[#0a0a0f] min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] ${className}`}>
        <div className={`page-container ${contentWidth} ${wrapperClassName}`}>{children}</div>
      </div>
    );
  }

  if (variant === 'plain') {
    return (
      <div className={`relative ${className}`}>
        <div className={`page-container ${contentWidth} ${wrapperClassName}`}>{children}</div>
      </div>
    );
  }

  // default + narrow
  return (
    <div className={`relative ${className}`}>
      {pattern && <div className="pattern" aria-hidden="true" />}
      <div className={`page-container ${contentWidth} ${wrapperClassName}`}>{children}</div>
    </div>
  );
}

export default PageLayout;
