import { addDays, endOfMonth, format, startOfMonth } from 'date-fns';

type DayInfo = { date: string; isAvailable: boolean; price?: number };

export function Calendar({ days }: { days: DayInfo[] }) {
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const slots: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) slots.push(d);
  const map = new Map(days.map(d => [d.date, d]));
  return (
    <div className="grid grid-cols-7 gap-2">
      {slots.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const info = map.get(key);
        const unavailable = info ? !info.isAvailable : false;
        return (
          <div key={key} className={`rounded border p-2 text-sm ${unavailable ? 'bg-red-50 opacity-60' : 'bg-white'}`}>
            <div className="font-medium">{format(d, 'd')}</div>
            {info?.price !== undefined && <div className="text-xs">Rp {info.price}</div>}
          </div>
        );
      })}
    </div>
  );
}
