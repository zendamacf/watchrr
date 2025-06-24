import Link from 'next/link';
import { MainNav } from './MainNav';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';

export function SiteHeader() {
  return (
    <header className="border-grid bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container-wrapper">
        <div className="flex h-14 items-center gap-2 md:gap-4">
          <MainNav />
          <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
            <nav className="flex items-center gap-0.5">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8 px-0">
                <Link href="https://github.com/zendamacf/watchrr" target="_blank" rel="noreferrer">
                  {/* <Icons.gitHub className="h-4 w-4" /> */}
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
