'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-4 flex items-center gap-2 lg:mr-6">
        {/* <Icons.logo className="h-6 w-6" /> */}
        <span className="font-bold lg:inline-block">watchrr</span>
      </Link>
      <nav className="flex items-center gap-4 text-sm xl:gap-6">
        <Link
          href="/"
          className={cn(
            'hover:text-foreground/80 transition-colors',
            pathname === '/' ? 'text-foreground' : 'text-foreground/80',
          )}
        >
          Home
        </Link>
        <Link
          href="/shows"
          className={cn(
            'hover:text-foreground/80 transition-colors',
            pathname === '/shows' ? 'text-foreground' : 'text-foreground/80',
          )}
        >
          Shows
        </Link>
        <Link
          href="/movies"
          className={cn(
            'hover:text-foreground/80 transition-colors',
            pathname === '/movies' ? 'text-foreground' : 'text-foreground/80',
          )}
        >
          Movies
        </Link>
      </nav>
    </div>
  );
}
