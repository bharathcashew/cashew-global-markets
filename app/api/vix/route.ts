import { guard } from '@/lib/auth';
import { getProvider } from '@/lib/provider';
export const GET = guard(async () => {
  const p = getProvider(); const v = await p.vol();
  const est6m = v.vix3m + (v.vix3m - v.vix) * 0.8;
  return Response.json({ ...v, est6m: +est6m.toFixed(1), vrp: +(v.vix - v.rv20).toFixed(1), contango: v.vix3m > v.vix, aboveFlip: v.spx > v.gammaFlip, source: p.name, licensed: p.licensed });
});
