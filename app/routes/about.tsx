import * as React from 'react';
import { useLocation } from 'react-router';
import { SectionHeading, SectionNav, ValuesCloud, type Section } from '@branchleft/components';
import { NextSteps } from '../components/Avenues';
import { VALUES } from '../components/values';
import { LinkedInIcon } from '../components/icons/LinkedInIcon';
import { buildMeta } from '../lib/meta';

export function meta() {
  return buildMeta({
    title: 'About — branchLeft',
    description:
      'branchLeft is a 100% worker-owned UK company committed to sustainability, environmental impact, responsible AI and societal good. Meet the values and people behind our work.',
    path: '/about',
  });
}

const SECTIONS: readonly Section[] = [
  { id: 'what-is-branchleft', label: 'What is branchLeft?' },
  { id: 'values', label: 'Values' },
  { id: 'people', label: 'People' },
];

export default function About() {
  const { hash } = useLocation();

  // Deep-link on load: if the URL contains a hash matching a section, jump
  // to it once the page has mounted so scroll-margin-top can offset the
  // sticky nav stack.
  React.useEffect(() => {
    if (hash === '') return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (el === null) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }, [hash]);

  return (
    <>
      <SectionNav sections={SECTIONS} ariaLabel="About sections" />
      <main className="long-form about-page">
        <SectionHeading as="h1" anchor="what-is-branchleft">
          What is <span className="bl-wordmark">branchLeft</span>?
        </SectionHeading>
        <section className="about-page__section" aria-labelledby="what-is-branchleft">
          <p>
            Founded in July 2026, <span className="bl-wordmark">branchLeft</span> is a 100%
            worker-owned UK company building technology for people & planet. The name reflects the
            subversion of the capitalistic model typically associated with tech. Extractive and
            exploitative practices are not a prerequisite for success, and we're here to prove it.
          </p>
          <p>
            Technology is an essential part of running any organisation. We're looking to lower the
            barrier to entry for people doing work that benefits our society. Beautiful, accessible
            and robust technology is something that can be built at pace and affordably, but this
            requires some new ways of thinking about how a tech company is structured and how it
            operates.
          </p>
          <p>
            Finding ethical suppliers and partners for tech can often be challenging, but good news,
            you've found us. It's early days, but we're committed to becoming a formal non-profit
            worker's cooperative as soon as we start scaling. That means we're both culturally and
            structurally aligned for sustainability, longevity and accountability; in terms of (but
            not limited to) environment, societal impact, and equitable employment.
          </p>
        </section>

        <section className="about-page__section" aria-labelledby="values">
          <SectionHeading as="h2" anchor="values">
            Values
          </SectionHeading>
          <ValuesCloud values={VALUES} ariaLabel="Values" />
        </section>

        <section className="about-page__section" aria-labelledby="people">
          <SectionHeading as="h2" anchor="people">
            People
          </SectionHeading>

          <article className="bio" aria-labelledby="bio-robert-murray">
            {/* Rendered at 10rem (160px, see .bio__photo) — srcset offers 1x/2x/3x
                so we ship pixels close to what the display can actually show,
                webp first with the original jpeg as a universal fallback. */}
            <picture>
              <source
                type="image/webp"
                srcSet="/people/headshot-160.webp 160w, /people/headshot-320.webp 320w, /people/headshot-480.webp 480w"
                sizes="160px"
              />
              <img
                className="bio__photo"
                src="/people/headshot-320.jpg"
                srcSet="/people/headshot-160.jpg 160w, /people/headshot-320.jpg 320w, /people/headshot-480.jpg 480w"
                sizes="160px"
                alt=""
                width={160}
                height={160}
              />
            </picture>

            <div className="bio__body">
              <div className="bio__name-row">
                <h3 className="bio__name" id="bio-robert-murray">
                  Robert Murray <span className="bio__pronouns">(they/them)</span>
                </h3>
                <a
                  href="https://www.linkedin.com/in/robertmurray8/"
                  className="bio__linkedin"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn profile"
                >
                  <LinkedInIcon className="bio__linkedin-icon" />
                </a>
              </div>
              <p className="bio__title">Director, Founder & Lead Engineer</p>
              <p>
                Our founder is the technical and ideological driving force behind{' '}
                <span className="bl-wordmark">branchLeft</span>.
              </p>
              <p>
                With a first-class Computer Science MEng from the University of Warwick, and over a
                decade of experience in software engineering and technical project management, they
                bring a combination of breadth and depth of expertise to every project.
              </p>
              <p>
                Robert's experience ranges from the bleeding-edge of emerging AI technology, to
                highly-regulated industries such as medicines and insurance, to large-scale
                enterprise and customer-facing systems.
              </p>
            </div>
          </article>
        </section>

        <NextSteps current="/about" />
      </main>
    </>
  );
}
