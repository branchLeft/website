import * as React from 'react';
import { Link } from 'react-router';

export function meta() {
  return [
    { title: 'Local News & Independent Media — branchLeft' },
    {
      name: 'description',
      content: 'A platform supporting journalists reporting on local issues in the UK.',
    },
  ];
}

export default function LocalNews(): React.JSX.Element {
  return (
    <main className="long-form article-page">
      <Link to="/about#solutions" className="directional-link back-link">
        <span className="directional-link__arrow" aria-hidden="true">
          ←
        </span>
        <span>Back</span>
      </Link>
      <h1>Local News &amp; Independent Media</h1>

      <section className="article-page__section">
        <p>
          Local news reporting in the public interest is more important than ever. Not too long ago,
          local newspapers and radio stations were the lifeblood of communities, providing residents
          with information about local events, politics, and issues that directly affected their
          lives.
        </p>
        <p>
          The intentional corporate consolidation of media by conglomerates, big tech and their
          billionaire-class backers has led to "news deserts" in many communities where local news
          has not survived. Local issues go unreported and residents are left uninformed.
          Communities are more vulnerable to misinformation/disinformation and malicious narratives
          seeking to divide people and erode the social fabric. A distracted and misinformed public
          benefits the financial interests of those who have used the technological revolution of
          the last few decades to consolidate power and wealth.
        </p>
      </section>

      <section className="article-page__section">
        <h2>...but we're not the first to notice.</h2>
        <p>
          There's no point in reiterating the brilliant vision that the Public Interest News
          Foundation (PINF) are already acting on. Learn more about their work at the following
          pages:
        </p>
        <ul>
          <li>
            <a href="https://www.publicinterestnews.org.uk/about/">About the PINF</a>
          </li>
          <li>
            <a href="https://map.publicinterestnews.org.uk/?ref=publicinterestnews.org.uk">
              Local News Desert Map
            </a>
          </li>
        </ul>
      </section>

      <section className="article-page__section">
        <h2>What We're Building</h2>
        <p>
          <span className="logo-font">branchLeft</span> is building relationships with the PINF and
          its members to provide a platform and ecosystem tailored to the needs of public interest
          local news outlets in the UK. Initially built around{' '}
          <a href="https://ghost.org/">Ghost</a>, we're developing the technical infrastructure
          enabling:
        </p>
        <div className="article-page__feature-group">
          <h3>Publishing Infrastructure</h3>
          <ul>
            <li>ethical and affordable hosting and CMS</li>
            <li>quick onboarding and migration</li>
            <li>incredible user experiences for journalists and readers</li>
            <li>cost-effective customisation of theme, branding, and site functionality</li>
          </ul>
        </div>
        <div className="article-page__feature-group">
          <h3>Revenue</h3>
          <ul>
            <li>paid subscriptions/memberships</li>
            <li>one-time donations/tips</li>
            <li>non-intrusive and ethical advertising, relevant to local audiences</li>
          </ul>
        </div>
        <div className="article-page__feature-group">
          <h3>Growing Your Audience</h3>
          <ul>
            <li>direct community engagement</li>
            <li>social media integrations and calls to action</li>
            <li>SEO (search engine optimization)</li>
            <li>geo-targeted advertising</li>
          </ul>
        </div>
      </section>

      <section className="article-page__section">
        <h2>Our Goal</h2>
        <p>
          We're building the tools needed to catalyse the revival of local news in the public
          interest in the UK. Because we're not seeking profit, when we build reusable and scalable
          infrastructure and patterns they can be shared cheaply to benefit all outlets that work
          with us.
        </p>
      </section>

      <section className="article-page__section">
        <h2>Work With Us</h2>
        <div className="article-page__callout">
          <p className="article-page__callout-label">New or growing outlet?</p>
          <p>
            If you're a local news outlet, or looking to start one, and want to learn more about how{' '}
            <span className="logo-font">branchLeft</span> can help you, please get in touch via our{' '}
            <Link to="/contact?category=local-news">contact form</Link>.
          </p>
        </div>
        <div className="article-page__callout">
          <p className="article-page__callout-label">Already well-established?</p>
          <p>
            If you're already well-established and Ghost isn't the right fit for you, please get in
            touch via our <Link to="/contact?category=bespoke-technology">contact form</Link> and
            we'll discuss how we can help you build a bespoke solution.
          </p>
        </div>
      </section>
    </main>
  );
}
