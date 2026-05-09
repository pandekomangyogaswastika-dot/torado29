/**
 * PageSEO — Reusable per-page SEO helmet component
 * Wraps react-helmet-async for consistent Open Graph, Twitter Card, and title/description tags.
 */
import { Helmet } from "react-helmet-async";

const DEFAULT_OG_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=630&fit=crop";
const SITE_NAME = "Torado Group";
const BASE_URL = "https://torado.id";

export default function PageSEO({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  keywords,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Crafted F&B Experiences`;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="id_ID" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@toradogroup" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
