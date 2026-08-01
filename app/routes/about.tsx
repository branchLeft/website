import * as React from 'react';
import { useLocation } from 'react-router';
import { TrendingUp, Leaf, Brain, Heart, Code, Activity, AlertCircle } from 'lucide-react';
import {
  SectionHeading,
  SectionNav,
  ValuesCloud,
  type Section,
  type Value,
} from '@branchleft/components';
import { SolutionsShowcase } from '../components/SolutionsShowcase';

export function meta() {
  return [{ title: 'About — branchLeft' }, { name: 'description', content: 'About branchLeft' }];
}

const SECTIONS: readonly Section[] = [
  { id: 'what-is-branchleft', label: 'What is branchLeft?' },
  { id: 'values', label: 'Values' },
  { id: 'people', label: 'People' },
  { id: 'solutions', label: 'Solutions' },
];

const VALUES: readonly Value[] = [
  {
    title: 'Sustainability & Longevity',
    icon: TrendingUp,
    accent: 'sustainability',
    body: "We have a laser focus on stable growth according to the means of the organisation. We don't answer to any external investors or private equity, and never will. We don't need to make profits to extract any surplus. We keep our costs low and our pricing fair, so that you can continue to work with us long-term. We enable this through engineering excellence and democratic decision-making.",
  },
  {
    title: 'Environmental Impact',
    icon: Leaf,
    accent: 'environment',
    body: 'All projects we work on are assessed for their environmental impact. We calculate the emissions of our deployed infrastructure and tool usage, and offset them such that we are carbon neutral. We proactively seek out work which helps address the climate crisis and reduces environmental harm.',
  },
  {
    title: 'Responsible AI',
    icon: Brain,
    accent: 'ai',
    body: 'We recognise the ethical, societal and environmental implications of artificial intelligence. AI can be leveraged to build solutions at pace that are a net-benefit to society. Where AI tools are used in software development, we use the most ethical options and use them responsibly. Where AI is used as part of the software we build, we work to ensure that it eliminates bias and uses models that are open source and auditable.',
  },
  {
    title: 'Societal Impact',
    icon: Heart,
    accent: 'society',
    body: 'We actively seek out work which has a positive societal impact. We are a catalyst and force-multiplier for people who do good. We find strategic ways to provide our services at low costs to organisations doing this work, without seeking any profit.',
  },
  {
    title: 'Open Source',
    icon: Code,
    accent: 'opensource',
    body: 'All code that we write by default is open source and given permissive licenses. Nobody wins when the same problem that the world faces needs to be solved many times over. We foster a virtuous cycle of development and improvement between ourselves, our clients, and the wider open source community. We actively contribute to, and ideally sponsor, open source projects that we rely on.',
  },
  {
    title: 'Agility',
    icon: Activity,
    accent: 'agility',
    body: 'We adapt quickly to a rapidly evolving world. We engineer our solutions to avoid lock-in to vendors or platforms. We build solutions that allow you to migrate away from us, and we demonstrate why you should stay. ',
  },
  {
    title: 'Red Lines',
    icon: AlertCircle,
    accent: 'redlines',
    body: 'We do not work with clients or on projects that are exploitative, extractive, or harmful to people or planet, anywhere in the world. Where possible, we avoid financially supporting any organisation engaged in or complicit in the climate crisis, human rights violations, armed conflict, or other forms of harm. We hold a clear political position, but are not affiliated or aligned with any political party.',
  },
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
          <h1>
            What is <span className="logo-font">branchLeft</span>?
          </h1>
        </SectionHeading>
        <section className="about-page__section" aria-labelledby="what-is-branchleft">
          <p>
            Founded in July 2026, <span className="logo-font">branchLeft</span> is a 100%
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
            <img
              className="bio__photo"
              src="/people/headshot.jpg"
              alt=""
              width={160}
              height={160}
            />
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
                  <img src="/icons/linkedin.svg" alt="" width={28} height={28} />
                </a>
              </div>
              <p className="bio__title">Director, Founder & Lead Engineer</p>
              <p>
                Our founder is the technical and ideological driving force behind{' '}
                <span className="logo-font">branchLeft</span>.
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

        <section className="about-page__section" aria-labelledby="solutions">
          <SectionHeading as="h2" anchor="solutions">
            Solutions
          </SectionHeading>
          <SolutionsShowcase />
        </section>
      </main>
    </>
  );
}
