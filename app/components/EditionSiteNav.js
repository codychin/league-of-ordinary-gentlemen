import Link from 'next/link';

export default function EditionSiteNav({root='/'}){
  return <nav className="siteNav">
    <Link href={root}>HOME</Link>
    <Link href={root+'#league'}>THE LEAGUE</Link>
    <Link href={root+'/teams'}>FRANCHISES</Link>
    <Link href={root+'#culture'}>CULTURE</Link>
    <Link href={root+'#scores'}>SCORES</Link>
    <details className="navMore"><summary>MORE</summary><div><Link href={root+"/archive"}>ARCHIVE</Link><Link href={root+"/newsroom"}>MASTHEAD</Link></div></details>
  </nav>;
}
