import { getTimezonesForCountry } from 'countries-and-timezones';
import { DateTime } from 'luxon';

const DEFAULT_TIMEZONE = 'Pacific/Auckland';

export function parseEpisodeDate(airdate: string, country: string | null, delayDays = 0) {
  let localDate: DateTime;
  const timezones = country ? getTimezonesForCountry(country) : [];
  if (timezones?.length) {
    const [tz] = timezones;
    localDate = DateTime.fromSQL(airdate, { zone: tz?.name }).set({ hour: 20 }).setZone(DEFAULT_TIMEZONE);
  } else {
    localDate = DateTime.fromSQL(airdate);
  }

  const originalLocalDate = localDate;
  const effectiveLocalDate = localDate.plus({ days: delayDays });
  const inPast = effectiveLocalDate.startOf('day') < DateTime.now().startOf('day');

  return { originalLocalDate, effectiveLocalDate, inPast };
}
