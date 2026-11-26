import { guard } from '@/lib/auth';
import { getProvider } from '@/lib/provider';
export const GET = guard(async () => { const p = getProvider(); return Response.json({ markets: await p.markets(), source: p.name, licensed: p.licensed }); });
