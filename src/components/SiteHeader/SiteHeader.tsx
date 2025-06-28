'use client';

import { Box, Burger, Divider, Drawer, Group, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { Logo } from '../Logo';
import classes from './SiteHeader.module.css';
import { ThemeToggle } from './ThemeToggle';

export function SiteHeader() {
  const [drawerOpened, { toggle, close }] = useDisclosure(false);

  return (
    <Box pb={120}>
      <MainNav drawerOpened={drawerOpened} toggleDrawer={toggle} />
      <MobileNav drawerOpened={drawerOpened} closeDrawer={close} />
    </Box>
  );
}

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shows', href: '/shows' },
  { label: 'Movies', href: '/movies' },
];

function MainNav({
  drawerOpened,
  toggleDrawer,
}: {
  drawerOpened: boolean;
  toggleDrawer: () => void;
}) {
  const pathname = usePathname();

  return (
    <header className={classes.header}>
      <Group justify="space-between" h="100%">
        <Logo w={160} />

        <Group h="100%" gap={0} visibleFrom="sm">
          {links.map((link) => (
            <a
              href={link.href}
              className={classNames(classes.link, {
                [classes.active_link]: pathname === link.href,
              })}
              key={link.href}
            >
              {link.label}
            </a>
          ))}
        </Group>

        <Group visibleFrom="sm">
          <ThemeToggle />
        </Group>

        <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="sm" />
      </Group>
    </header>
  );
}

function MobileNav({
  drawerOpened,
  closeDrawer,
}: {
  drawerOpened: boolean;
  closeDrawer: () => void;
}) {
  const pathname = usePathname();
  return (
    <Drawer
      opened={drawerOpened}
      onClose={closeDrawer}
      size="100%"
      padding="md"
      title={<Logo w={180} />}
      hiddenFrom="sm"
      zIndex={1000000}
    >
      <ScrollArea h="calc(100vh - 80px" mx="-md">
        <Divider my="sm" />

        {links.map((link) => (
          <a
            href={link.href}
            className={classNames(classes.link, { [classes.active_link]: pathname === link.href })}
            key={link.href}
          >
            {link.label}
          </a>
        ))}

        <Divider my="sm" />

        <Group justify="center" grow pb="xl" px="md">
          <ThemeToggle />
        </Group>
      </ScrollArea>
    </Drawer>
  );
}
