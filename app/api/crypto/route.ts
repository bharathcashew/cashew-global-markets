import { guard } from '@/lib/auth';
import { getProvider } from '@/lib/provider';
export const GET = guard(async () => { const p = getProvider(); return Response.json({ coins: await p.crypto(), source: p.name, licensed: p.licensed }); });
