import { Button } from '@mantine/core';
import Link from 'next/link';
import { MainNav } from './MainNav';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  return (
    <header>
      <div>
        <div>
          <MainNav />
          <div>
            <nav>
              <Button variant="ghost" size="icon">
                <Link href="https://github.com/zendamacf/watchrr" target="_blank" rel="noreferrer">
                  {/* <Icons.gitHub /> */}
                  <span>GitHub</span>
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
