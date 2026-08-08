# Graph Report - . (2026-08-08)

## Corpus Check

- Corpus is ~37,690 words - fits in a single context window. You may not need a graph.

## Summary

- 425 nodes · 527 edges · 72 communities (29 shown, 43 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.79)
- Token cost: 128,374 input · 0 output

## Community Hubs (Navigation)

- GCP Infra Provisioning
- Page Metadata & SEO
- Contact Form Email Handler
- Runtime Dependencies
- React Router Skill & Dependabot Config
- Footer & Icon Components
- TypeScript Ambient Refs
- Navbar & Social Icons
- Infra TypeScript Config
- Infra Package Dependencies
- Playwright E2E & A11y Tests
- Lint & A11y Test Tooling
- Pre-commit Hook Config
- Brand, Stack & License Docs
- Edge Delete-Guard Script
- Dependency Update Policy
- Brand & Social Assets
- Content & Copy Guidelines
- Open Source Licensing
- Routes & Styling Conventions
- Testing & Accessibility Conventions
- eslint-config-prettier Dependency
- eslint-js Dependency
- eslint-plugin-react Dependency
- eslint-plugin-react-hooks Dependency
- globals Dependency
- jsdom Dependency
- playwright-test Dependency
- prettier Dependency
- react-router-dev Dependency
- tailwindcss Dependency
- tailwindcss-vite Dependency
- types-node Dependency
- types-nodemailer Dependency
- types-react Dependency
- typescript Dependency
- typescript-eslint Dependency
- typescript-eslint-eslint-plugin Dependency
- typescript-eslint-parser Dependency
- vite Dependency
- vitejs-plugin-react Dependency
- vitest Dependency
- vitest-coverage-v8 Dependency
- vitest-ui Dependency
- React Router: Data & Mutations
- React Router: Forms & Pending UI
- React Router: Middleware & Sessions
- React Router: Rendering Strategy
- React Router: Route Configuration
- React Router: Route Modules
- React Router: RSC Framework
- React Router: Type Safety
- React Router: RSC Future Path
- Code Quality Convention
- Components Convention
- Node Version Pin
- Contributing Prerequisites
- Third-Party Fonts Notice
- Team Headshot

## God Nodes (most connected - your core abstractions)

1. `buildMeta()` - 16 edges
2. `compilerOptions` - 15 edges
3. `compilerOptions` - 12 edges
4. `scripts` - 11 edges
5. `checkA11y()` - 11 edges
6. `react` - 9 edges
7. `sendContactEmail()` - 8 edges
8. `useHasMounted()` - 7 edges
9. `action()` - 7 edges
10. `CI Workflow` - 6 edges

## Surprising Connections (you probably didn't know these)

- `Routing Strategy (Framework Mode lock)` --semantically_similar_to--> `Framework Mode Committed Strategy` [INFERRED] [semantically similar]
  CLAUDE.md → .agents/skills/react-router/references/framework-mode.md
- `branchLeft website overview` --semantically_similar_to--> `Stack (React 19, React Router v7, Tailwind v4, Vite 8)` [INFERRED] [semantically similar]
  README.md → CLAUDE.md
- `AffordableWebsites()` --references--> `react` [EXTRACTED]
  app/routes/solutions.affordable-websites.tsx → package.json
- `NavDropdown()` --references--> `react` [EXTRACTED]
  app/components/NavBar.tsx → package.json
- `About()` --references--> `react` [EXTRACTED]
  app/routes/about.tsx → package.json

## Import Cycles

- None detected.

## Hyperedges (group relationships)

- **CI/CD Pipeline Flow (checks/e2e gate pulumi-preview/deploy)** — _github_workflows_ci_checks_job, _github_workflows_ci_e2e_job, _github_workflows_ci_pulumi_preview_job, _github_workflows_ci_deploy_job [EXTRACTED 1.00]
- **GCP Bootstrap Chicken-and-Egg IAM Pattern** — infra_known_issues_domain_mapping_hangs, infra_known_issues_deployer_sa_state_bucket_iam, infra_known_issues_kms_bootstrap, infra_known_issues_deployer_sa_serviceusage_admin [EXTRACTED 1.00]
- **Pre-rendering Safety Constraint (why prerender stays off)** — known_issues_prerendering_security_headers, claude_routing_strategy, _agents_skills_react_router_references_framework_mode_committed_strategy [INFERRED 0.85]

## Communities (72 total, 43 thin omitted)

### Community 0 - "GCP Infra Provisioning"

Cohesion: 0.07
Nodes (39): enabledApis, requiredServices, repository, service, serviceName, artifactRegistryRepoId, config, gcpConfig (+31 more)

### Community 1 - "Page Metadata & SEO"

Cohesion: 0.09
Nodes (20): buildMeta(), ORGANIZATION_JSON_LD, PageMetaInput, SITE_URL, findByKey(), findByKeyValue(), MetaEntries, MetaEntry (+12 more)

### Community 2 - "Contact Form Email Handler"

Cohesion: 0.09
Nodes (26): buildHtml(), buildText(), ContactSubmission, escapeHtml(), getTransport(), sendContactEmail(), ORIGINAL_ENV, { sendMail, createTransport } (+18 more)

### Community 3 - "Runtime Dependencies"

Cohesion: 0.06
Nodes (34): @branchleft/components, framer-motion, isbot, lucide-react, nodemailer, dependencies, @branchleft/components, framer-motion (+26 more)

### Community 4 - "React Router Skill & Dependabot Config"

Cohesion: 0.10
Nodes (30): Framework Mode Committed Strategy, Legacy Patterns to Migrate, React Router v7 Framework Mode (Locked), Skill References Table, Dependabot: GitHub Actions updates, Dependabot: infra/ npm updates, CI: checks job (Typecheck, Pre-commit & Coverage), CI: deploy job (+22 more)

### Community 5 - "Footer & Icon Components"

Cohesion: 0.10
Nodes (13): Footer(), BlueskyIcon(), GitHubIcon(), MediumIcon(), ICONS, SocialLinksItems(), streamTimeout, buildContentSecurityPolicy() (+5 more)

### Community 6 - "TypeScript Ambient Refs"

Cohesion: 0.08
Nodes (27): **/_, **/.client/**/_, DOM, DOM.Iterable, infra, node, .react-router/types/**/_, **/.server/**/_ (+19 more)

### Community 7 - "Navbar & Social Icons"

Cohesion: 0.11
Nodes (20): LinkedInIcon(), isDropdown(), NAV_LINKS, NavBar(), NavDropdown(), NavDropdownItem, NavLinkItem, NavLinksItems() (+12 more)

### Community 8 - "Infra TypeScript Config"

Cohesion: 0.12
Nodes (15): compilerOptions, experimentalDecorators, lib, module, moduleResolution, noFallthroughCasesInSwitch, outDir, pretty (+7 more)

### Community 9 - "Infra Package Dependencies"

Cohesion: 0.14
Nodes (13): dependencies, @pulumi/gcp, @pulumi/pulumi, devDependencies, @types/node, typescript, @types/node, typescript (+5 more)

### Community 11 - "Lint & A11y Test Tooling"

Cohesion: 0.29
Nodes (7): @axe-core/playwright, eslint, devDependencies, @axe-core/playwright, eslint, @types/react-dom, @types/react-dom

### Community 12 - "Pre-commit Hook Config"

Cohesion: 0.33
Nodes (6): eslint hook, pre-commit-hooks (trailing-whitespace, EOF, YAML, large-file, merge-conflict), prettier hook, vitest hook, Pre-Commit Hooks (what runs on commit), Pre-commit hooks setup

### Community 13 - "Brand, Stack & License Docs"

Cohesion: 0.33
Nodes (6): Brand source assets (logo/wordmark), Stack (React 19, React Router v7, Tailwind v4, Vite 8), Setup steps, Trademarks and brand assets, robots.txt rules, branchLeft website overview

### Community 14 - "Edge Delete-Guard Script"

Cohesion: 0.70
Nodes (4): edge_deletes(), main(), Return the edge resources `text` plans to delete. Pairs each `(delete)` line…, self_test()

### Community 15 - "Dependency Update Policy"

Cohesion: 0.50
Nodes (4): Dependabot: npm root updates, Fork PR install failure (missing GitHub PAT), pnpm-workspace allowBuilds, minimumReleaseAgeExclude (@branchleft/*)

### Community 16 - "Brand & Social Assets"

Cohesion: 0.67
Nodes (4): branchLeft Logo (lightning-bolt mark), branchLeft Wordmark (icon + "branchLeft" text lockup), Favicon Set (32/192/512px + apple-touch-icon, same lightning-bolt mark), Social Share Card (og-image: logo + wordmark on black)

## Knowledge Gaps

- **168 isolated node(s):** `NavLinkItem`, `NavDropdownItem`, `NAV_LINKS`, `ICONS`, `Solution` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Runtime Dependencies` to `Navbar & Social Icons`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `react` connect `Navbar & Social Icons` to `Page Metadata & SEO`, `Runtime Dependencies`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Lint & A11y Test Tooling` to `Runtime Dependencies`, `eslint-config-prettier Dependency`, `eslint-js Dependency`, `eslint-plugin-react Dependency`, `eslint-plugin-react-hooks Dependency`, `globals Dependency`, `jsdom Dependency`, `playwright-test Dependency`, `prettier Dependency`, `react-router-dev Dependency`, `tailwindcss Dependency`, `tailwindcss-vite Dependency`, `types-node Dependency`, `types-nodemailer Dependency`, `types-react Dependency`, `typescript Dependency`, `typescript-eslint Dependency`, `typescript-eslint-eslint-plugin Dependency`, `typescript-eslint-parser Dependency`, `vite Dependency`, `vitejs-plugin-react Dependency`, `vitest Dependency`, `vitest-coverage-v8 Dependency`, `vitest-ui Dependency`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **What connects `NavLinkItem`, `NavDropdownItem`, `NAV_LINKS` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `GCP Infra Provisioning` be split into smaller, more focused modules?**
  _Cohesion score 0.07346938775510205 - nodes in this community are weakly interconnected._
- **Should `Page Metadata & SEO` be split into smaller, more focused modules?**
  _Cohesion score 0.08907563025210084 - nodes in this community are weakly interconnected._
- **Should `Contact Form Email Handler` be split into smaller, more focused modules?**
  _Cohesion score 0.09411764705882353 - nodes in this community are weakly interconnected._
