import { Helmet } from 'react-helmet-async';
import {
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_IMAGE,
  absoluteUrl,
} from '../config/site';

/**
 * SEO Component
 *
 * Adds dynamic meta tags to every page for search engine indexing.
 * Use this on every page to ensure Google indexes your content.
 *
 * Usage:
 *   <SEO title="Movie Title" description="Watch movie online" image="https://..." />
 */

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  tags,
}) => {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const fullUrl = absoluteUrl(url);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={tags?.join(', ') || DEFAULT_KEYWORDS} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image?.startsWith('http') ? image : absoluteUrl(image)} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image?.startsWith('http') ? image : absoluteUrl(image)} />

      {/* Article specific */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Additional meta */}
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#030014" />
    </Helmet>
  );
};

export default SEO;
