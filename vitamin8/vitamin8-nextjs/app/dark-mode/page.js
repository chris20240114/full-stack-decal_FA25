'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

export default function DarkModePage() {
  const pathname = usePathname();
  const isDarkMode = pathname === '/dark-mode';

  return (
    <main className={clsx('container', { 'dark-mode': isDarkMode })}>
      <h1>Dark Mode Page</h1>
      <p>Current pathname: {pathname}</p>

      <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
        <Link href="/dark-mode">
          <button>Dark-Mode</button>
        </Link>

        <Link href="/light-mode">
          <button>Light-Mode</button>
        </Link>
      </div>
    </main>
  );
}
