'use client';

import { Burger, Drawer, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classNames from 'classnames';
import { BarChart3, CalendarDays, Compass, Film, LogOut, Tv } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { routes } from '@/lib/routes';
import { Logo } from '../Logo';
import { AppFooter } from './AppFooter';
import { isActiveRoute } from './isActiveRoute';
import classes from './SiteHeader.module.css';
import { SnoozedIndicator } from './SnoozedIndicator';
import { ThemeMenuItem } from './ThemeMenuItem';
import { ThemeToggle } from './ThemeToggle';

const links: { label: string; href: string; icon: ReactNode }[] = [
  { label: 'Episodes', href: routes.episodes, icon: <CalendarDays size={22} aria-hidden /> },
  { label: 'Shows', href: routes.shows, icon: <Tv size={22} aria-hidden /> },
  { label: 'Movies', href: routes.movies, icon: <Film size={22} aria-hidden /> },
  { label: 'Discover', href: routes.discover, icon: <Compass size={22} aria-hidden /> },
  { label: 'Stats', href: routes.stats, icon: <BarChart3 size={22} aria-hidden /> },
];

export function SiteHeader() {
  const [drawerOpened, { toggle, close }] = useDisclosure(false);

  return (
    <>
      <MainNav drawerOpened={drawerOpened} toggleDrawer={toggle} />
      <MobileMenu drawerOpened={drawerOpened} closeDrawer={close} />
      <MobileTabBar />
    </>
  );
}

function MainNav({ drawerOpened, toggleDrawer }: { drawerOpened: boolean; toggleDrawer: () => void }) {
  const pathname = usePathname();

  return (
    <header className={classes.header}>
      <Group justify="space-between" h="100%">
        <Link href={routes.home}>
          <Logo w={160} />
        </Link>

        <Group h="100%" gap={0} visibleFrom="sm" component="nav" aria-label="Primary">
          {links.map((link) => (
            <Link
              href={link.href}
              className={classNames(classes.link, {
                [classes.active_link!]: isActiveRoute(pathname, link.href),
              })}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </Group>

        <Group h="100%" visibleFrom="sm">
          <SnoozedIndicator />
          <ThemeToggle />
          <SignOutButton className={classes.link} />
        </Group>

        <Group h="100%" gap="xs" hiddenFrom="sm">
          <SnoozedIndicator />
          <Burger opened={drawerOpened} onClick={toggleDrawer} aria-label="Menu" />
        </Group>
      </Group>
    </header>
  );
}

/** Account actions only; page navigation lives in the bottom tab bar on mobile. */
function MobileMenu({ drawerOpened, closeDrawer }: { drawerOpened: boolean; closeDrawer: () => void }) {
  return (
    <Drawer
      opened={drawerOpened}
      onClose={closeDrawer}
      position="right"
      size="xs"
      padding="md"
      title={<Logo w={140} />}
      hiddenFrom="sm"
      zIndex={1000000}
    >
      <Stack gap="md">
        <ThemeMenuItem className={classes.link} style={{ paddingInline: 0 }} />
        <SignOutButton
          className={classes.link}
          style={{ paddingLeft: 0 }}
          icon={<LogOut size={18} aria-hidden />}
          onSignedOut={closeDrawer}
        />
      </Stack>
      <AppFooter className={classes.drawerFooter} />
    </Drawer>
  );
}

function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className={classes.tabbar} aria-label="Primary mobile">
      {links.map((link) => {
        const active = isActiveRoute(pathname, link.href);
        return (
          <Link
            href={link.href}
            key={link.href}
            aria-current={active ? 'page' : undefined}
            className={classNames(classes.tab, { [classes.active_link!]: active })}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
