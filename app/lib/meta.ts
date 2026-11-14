import type { MetaDescriptor } from 'react-router';
import { SOCIAL_LINKS } from './social-links';

/**
 * Shared meta-tag builder, so every route gets canonical and social-card tags
 * that cannot drift apart or go missing.
 */

/**
 * Production origin. Social crawlers silently drop relative og:/twitter: URLs,
 * so every URL is absolute. A constant, so local dev emits the same tags.
 */
export const SITE_URL = 'https://branchleft.co.uk';

/**
 * Placeholder: 404s until public/og-image.png exists. SVG is not reliably
 * rendered by link unfurlers, which expect a raster image.
 */
const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

// Describes the actual generated asset at public/og-image.png (see
// scripts/generate-og-image.mjs): the branchLeft logo mark and wordmark,
// centered on a plain black background matching --color-bg.
const DEFAULT_OG_IMAGE_ALT = 'branchLeft logo and wordmark on a black background';

/**
 * schema.org/Organization JSON-LD on every real page (see buildMeta). No
 * LocalBusiness: there is no public physical location to publish.
 */
const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'branchLeft',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  sameAs: SOCIAL_LINKS.map((s) => s.href),
} as const;

/**
 * Search Console HTML-tag verification, unset: a DNS-verified domain property
 * already covers every subdomain. Set only to a real token, never a placeholder.
 */
const GOOGLE_SITE_VERIFICATION: string | undefined = undefined;

export interface PageMetaInput {
  /** Rendered verbatim as `<title>` and `og:title`/`twitter:title`. */
  readonly title: string;
  /** Rendered as the meta description and `og:description`/`twitter:description`. */
  readonly description: string;
  /** Route path (e.g. `/`, `/about`) used to build the canonical URL and `og:url`. */
  readonly path: string;
  /** Root-relative or absolute image URL. Defaults to the site-wide placeholder above. */
  readonly image?: string;
  /** Alt text for `image`. Only meaningful alongside a custom `image`. */
  readonly imageAlt?: string;
}

/**
 * Builds the full `MetaDescriptor[]` for a route: title, description,
 * canonical link, Open Graph tags, and Twitter Card tags.
 */
export function buildMeta({
  title,
  description,
  path,
  image,
  imageAlt,
}: PageMetaInput): MetaDescriptor[] {
  const url = `${SITE_URL}${path}`;
  const resolvedImage = new URL(image ?? DEFAULT_OG_IMAGE_PATH, SITE_URL).toString();
  const resolvedImageAlt = imageAlt ?? DEFAULT_OG_IMAGE_ALT;

  return [
    { title },
    { name: 'description', content: description },
    { tagName: 'link', rel: 'canonical', href: url },

    // Open Graph — read by LinkedIn, Bluesky, Slack, Facebook, and most
    // other link-unfurlers that don't speak the Twitter-specific tags below.
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'branchLeft' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: resolvedImage },
    { property: 'og:image:alt', content: resolvedImageAlt },

    // Twitter Card — X reads these in preference to the Open Graph
    // equivalents above even though it also understands OG as a fallback.
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: resolvedImage },
    { name: 'twitter:image:alt', content: resolvedImageAlt },

    // Structured data — every real page gets this (see the module comment
    // on GOOGLE_SITE_VERIFICATION and ORGANIZATION_JSON_LD above for why
    // this lives here rather than in root.tsx: root.tsx's own meta() is
    // only reached by unmatched routes, never by a real page).
    { 'script:ld+json': ORGANIZATION_JSON_LD },

    ...(GOOGLE_SITE_VERIFICATION
      ? [{ name: 'google-site-verification', content: GOOGLE_SITE_VERIFICATION }]
      : []),
  ];
}
