'use client';

import { DateTime } from 'luxon';

export function FormattedDate({ iso }: { iso: string }) {
  const formatted = DateTime.fromISO(iso).toFormat('cccc dd/LL/kkkk');
  return <>{formatted}</>;
}
