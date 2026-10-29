import Link from 'next/link';
import Preferences from './Preferences';

export const metadata = { title: 'Browser analytics preference — The Brief', robots: { index: false, follow: false } };

export default function AnalyticsPreferences() {
  return <main style={{maxWidth: 640, margin: '3rem auto', padding: '0 1rem'}}>
    <h1>Browser analytics preference</h1>
    <Preferences/>
    <p>This setting stays in this browser’s local storage and applies to future pageviews on this site. This settings page is never counted.</p>
    <p>Set it separately in every browser, profile, device, and installed app you use. An installed app may share browser storage or have its own: open this page inside the app to check. Private browsing and clearing site data can reset the preference. Each site domain has its own setting.</p>
    <p>This does not identify you or remove earlier visits. Visitor counts are estimates from Vercel’s standard service, not a list of people.</p>
    <Link href="/">Return to The Brief</Link>
  </main>;
}
