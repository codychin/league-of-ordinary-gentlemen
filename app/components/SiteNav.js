// Navigation cache pilot: unchanged runtime output.
import Link from 'next/link'
export default function SiteNav(){return <nav className="siteNav" aria-label="Primary navigation"><Link href="/">HOME</Link><Link href="/#league">THE LEAGUE</Link><Link href="/teams">FRANCHISES</Link><Link href="/archive">THE CRATES</Link><Link href="/#scores">SCORES</Link><details className="navMore"><summary>MORE</summary><div><Link href="/staff">MASTHEAD</Link><Link href="/corrections">CORRECTIONS</Link></div></details></nav>}
