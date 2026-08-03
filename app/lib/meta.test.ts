import { describe, expect, it } from 'vitest';

import { buildMeta, SITE_URL } from './meta';

type MetaEntries = ReturnType<typeof buildMeta>;
type MetaEntry = Record<string, unknown>;

// Small lookup helpers (rather than a generic `predicate`-taking finder) —
// a standalone function-type parameter here trips the base `no-unused-vars`
// rule on its type-only parameter name (a known false positive when
// `@typescript-eslint/no-unused-vars` runs alongside the base rule, as this
// repo's eslint.config.js does), so key/value lookups sidestep it entirely.
function findByKey(entries: MetaEntries, key: string): MetaEntry | undefined {
  return entries.find((entry) => key in (entry as MetaEntry)) as MetaEntry | undefined;
}

function findByKeyValue(entries: MetaEntries, key: string, value: string): MetaEntry | undefined {
  return entries.find((entry) => (entry as MetaEntry)[key] === value) as MetaEntry | undefined;
}

describe('buildMeta', () => {
  it('emits title, description, and an absolute canonical link built from SITE_URL + path', () => {
    const descriptors = buildMeta({
      title: 'About — branchLeft',
      description: 'About branchLeft',
      path: '/about',
    });

    expect(findByKey(descriptors, 'title')).toEqual({ title: 'About — branchLeft' });
    expect(findByKeyValue(descriptors, 'name', 'description')).toEqual({
      name: 'description',
      content: 'About branchLeft',
    });

    const canonical = findByKeyValue(descriptors, 'rel', 'canonical');
    expect(canonical).toEqual({
      tagName: 'link',
      rel: 'canonical',
      href: `${SITE_URL}/about`,
    });
  });

  it('mirrors title/description into Open Graph and Twitter Card tags, and falls back to the default share image', () => {
    const descriptors = buildMeta({
      title: 'Contact — branchLeft',
      description: 'Contact branchLeft',
      path: '/contact',
    });

    expect(findByKeyValue(descriptors, 'property', 'og:title')).toEqual({
      property: 'og:title',
      content: 'Contact — branchLeft',
    });
    expect(findByKeyValue(descriptors, 'property', 'og:description')).toEqual({
      property: 'og:description',
      content: 'Contact branchLeft',
    });
    expect(findByKeyValue(descriptors, 'property', 'og:url')).toEqual({
      property: 'og:url',
      content: `${SITE_URL}/contact`,
    });
    expect(findByKeyValue(descriptors, 'property', 'og:type')).toEqual({
      property: 'og:type',
      content: 'website',
    });
    expect(findByKeyValue(descriptors, 'property', 'og:site_name')).toEqual({
      property: 'og:site_name',
      content: 'branchLeft',
    });

    expect(findByKeyValue(descriptors, 'name', 'twitter:card')).toEqual({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    expect(findByKeyValue(descriptors, 'name', 'twitter:title')).toEqual({
      name: 'twitter:title',
      content: 'Contact — branchLeft',
    });
    expect(findByKeyValue(descriptors, 'name', 'twitter:description')).toEqual({
      name: 'twitter:description',
      content: 'Contact branchLeft',
    });

    // No `image`/`imageAlt` supplied — og:image and twitter:image should
    // both resolve to the same site-wide default, as an absolute URL.
    const ogImage = findByKeyValue(descriptors, 'property', 'og:image');
    const twitterImage = findByKeyValue(descriptors, 'name', 'twitter:image');
    expect(ogImage?.content).toBe(twitterImage?.content);
    expect(ogImage?.content).toMatch(/^https:\/\/branchleft\.co\.uk\//);
  });

  it('resolves a custom root-relative image against SITE_URL and uses the supplied alt text', () => {
    const descriptors = buildMeta({
      title: 'Affordable Websites — branchLeft',
      description: 'Websites built at-cost.',
      path: '/solutions/affordable-websites',
      image: '/people/headshot-480.jpg',
      imageAlt: 'A custom description of the image.',
    });

    expect(findByKeyValue(descriptors, 'property', 'og:image')).toEqual({
      property: 'og:image',
      content: `${SITE_URL}/people/headshot-480.jpg`,
    });
    expect(findByKeyValue(descriptors, 'property', 'og:image:alt')).toEqual({
      property: 'og:image:alt',
      content: 'A custom description of the image.',
    });
    expect(findByKeyValue(descriptors, 'name', 'twitter:image')).toEqual({
      name: 'twitter:image',
      content: `${SITE_URL}/people/headshot-480.jpg`,
    });
    expect(findByKeyValue(descriptors, 'name', 'twitter:image:alt')).toEqual({
      name: 'twitter:image:alt',
      content: 'A custom description of the image.',
    });
  });

  it('passes an already-absolute custom image URL through unchanged', () => {
    const descriptors = buildMeta({
      title: 'Local News — branchLeft',
      description: 'Local news.',
      path: '/solutions/local-news',
      image: 'https://cdn.example.com/share.png',
      imageAlt: 'Example alt text.',
    });

    expect(findByKeyValue(descriptors, 'property', 'og:image')).toEqual({
      property: 'og:image',
      content: 'https://cdn.example.com/share.png',
    });
  });
});
