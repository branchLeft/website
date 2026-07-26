export function meta() {
  return [{ title: 'branchLeft' }, { name: 'description', content: 'branchLeft' }];
}

export default function Home() {
  return (
    <main className="min-h-screen bg-bg flex flex-col items-center justify-center gap-12">
      <img src="/logo.svg" alt="branchLeft logo" className="w-36 h-36" />
      <h1 className="font-wordmark text-fg text-6xl font-light">branchLeft</h1>
      <p className="text-brand text-sm">coming soon</p>
    </main>
  );
}
