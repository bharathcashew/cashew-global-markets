import { guard } from '@/lib/auth';
import { clusters, recentInsiders } from '@/lib/edgar';
export const GET = guard(async () => {
  const rows = await recentInsiders();
  return Response.json({ rows: rows.slice(0, 80), clusters: clusters(rows).slice(0, 12), source: 'SEC EDGAR', licensed: true });
});
