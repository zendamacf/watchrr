'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const pathname = usePathname();

  return (
    <div>
      <Link href="/">
        {/* <Icons.logo /> */}
        <span>watchrr</span>
      </Link>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/shows">Shows</Link>
        <Link href="/movies">Movies</Link>
      </nav>
    </div>
  );
}
