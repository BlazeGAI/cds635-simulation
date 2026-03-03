import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <div className="card">
        <h1>CDS635 Simulation</h1>
        <p>Open Week 1 simulation:</p>
        <Link href="/week/1">/week/1</Link>
      </div>
    </main>
  );
}
