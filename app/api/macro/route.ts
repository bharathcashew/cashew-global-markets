import { guard } from '@/lib/auth';
import { macro } from '@/lib/fred';
export const GET = guard(async () => Response.json({ ...(await macro()), source: 'FRED', licensed: true }));
