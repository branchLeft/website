/**
 * Social profile URLs, shared between `SocialLinksItems.tsx` (renders the
 * footer/home icon links) and `meta.ts` (feeds `sameAs` in the Organization
 * JSON-LD) so there's exactly one list instead of two that can drift.
 */
export const SOCIAL_LINKS: readonly { href: string; label: string }[] = [
  { href: 'https://bsky.app/profile/branchleft.bsky.social', label: 'Bluesky' },
  { href: 'https://www.linkedin.com/company/branchleft', label: 'LinkedIn' },
  { href: 'https://medium.com/@branchleft', label: 'Medium' },
  { href: 'https://github.com/branchLeft', label: 'GitHub' },
] as const;
