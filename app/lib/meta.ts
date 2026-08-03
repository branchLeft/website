import type { MetaDescriptor } from 'react-router';

/**
 * Shared meta-tag builder. Every route calls this from its own `meta()`
 * export instead of hand-rolling `<title>`/description/OG/Twitter tags, so
 * the canonical URL and social-card boilerplate can't drift between routes
 * or go missing on a new one.
 *
 * Before this existed, most routes only emitted `title` and `description` —
 * no canonical link, and nothing at all for Open Graph or Twitter Cards, so
 * links shared on LinkedIn/Bluesky/Slack rendered as bare text with no
 * title card or image.
 */

/**
 * Production origin. Canonical, `og:url`, and `og:image`/`twitter:image`
 * must all be absolute — crawlers for OG/Twitter Cards silently ignore
 * relative URLs, unlike a plain `<link rel="canonical">`, which tolerates
 * one. Hardcoded rather than read from an env var: this is the one and only
 * public origin this site is ever served from, and a build-time constant
 * means every environment (including local dev) still emits real,
 * crawlable-looking tags.
 */
export const SITE_URL = 'https://branchleft.co.uk';

/**
 * No branded social-share image exists in this repo yet (only the SVG brand
 * mark served at `/logo.svg` — see logo-svg.tsx — and SVG is not reliably
 * rendered by LinkedIn/X/Slack link unfurlers, which expect a raster
 * image). This path is a deliberate placeholder: it 404s until a real
 * asset lands at `public/og-image.png` (recommended 1200x630, per the Open
 * Graph image guidance). Tracked as a placeholder in the PR description,
 * not a TODO comment, since there's no committed source string to search
 * for otherwise (a URL, unlike prose, doesn't read as obviously synthetic
 * on its own).
 */
const DEFAULT_OG_IMAGE_PATH = '/og-image.png';

// ALL_CAPS placeholder — see CLAUDE.md's "never write prose" rule. Alt text
// describes image *content*, which nobody but the site owner can supply
// once the real image above exists.
const DEFAULT_OG_IMAGE_ALT = 'TODO_OG_IMAGE_ALT';

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
  ];
}
