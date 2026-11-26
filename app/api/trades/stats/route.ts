import { guard } from '@/lib/auth';
import { store } from '@/lib/store';
import { tradeStats } from '@/lib/calc';
export const GET = guard(async (u) => Response.json(tradeStats(await store.listTrades(u))));
