/**
 * Social profile URLs, shared by SocialLinksItems.tsx and the Organization
 * JSON-LD `sameAs` in meta.ts, so there is one list that cannot drift.
 */
export const SOCIAL_LINKS: readonly { href: string; label: string }[] = [
  { href: 'https://bsky.app/profile/branchleft.bsky.social', label: 'Bluesky' },
  { href: 'https://www.linkedin.com/company/branchleft', label: 'LinkedIn' },
  { href: 'https://medium.com/@branchleft', label: 'Medium' },
  { href: 'https://github.com/branchLeft', label: 'GitHub' },
] as const;
