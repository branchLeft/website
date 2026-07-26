export function meta() {
  return [{ title: 'branchLeft' }, { name: 'description', content: 'branchLeft' }];
}

export default function Home() {
  return (
    <main className="page-shell">
      <img src="/logo.svg" alt="branchLeft logo" className="brand-mark" />
      <h1 className="hero-wordmark">branchLeft</h1>
      <p className="tagline">coming soon</p>
    </main>
  );
}
