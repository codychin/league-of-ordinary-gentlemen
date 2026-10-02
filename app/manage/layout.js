import Link from 'next/link';
import './manage.css';

export const dynamic = 'force-dynamic';
export const metadata = {title: 'Management — The Brief', robots: {index: false, follow: false}};

export default function ManageLayout({children}) {
  return <div className="managementArea"><header className="managementHeader"><Link href="/manage">THE BRIEF <span>MANAGEMENT</span></Link><Link href="/sunday-crew">View Sunday Crew ↗</Link></header>{children}<footer className="managementFooter">The newsroom is shared. Your bureau is yours.</footer></div>;
}
