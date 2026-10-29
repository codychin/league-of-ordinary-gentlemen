'use client';

import { Analytics } from '@vercel/analytics/next';
import { usePathname } from 'next/navigation';
import { beforeSendPageview } from '../../lib/web-analytics.mjs';

export default function PageviewAnalytics() {
  const pathname = usePathname();
  // Keep individual article URLs instead of grouping them under [slug]. The
  // SDK owns pageviews, including SPA transitions; never call track() as well.
  return <Analytics route={pathname} beforeSend={beforeSendPageview} mode="production" debug={false}/>;
}
