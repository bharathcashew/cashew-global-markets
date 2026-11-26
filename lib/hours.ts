export function marketStatus(m: { tz: string; open: string; close: string; days?: number[] }, now: Date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: m.tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(now);
  const g = (t: string) => f.find(p => p.type === t)?.value || '';
  const hm = `${g('hour') === '24' ? '00' : g('hour')}:${g('minute')}`;
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday'));
  const days = m.days || [1, 2, 3, 4, 5];
  return { local: hm, isOpen: days.includes(dow) && hm >= m.open && hm < m.close };
}
