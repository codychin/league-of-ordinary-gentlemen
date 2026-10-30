import Link from 'next/link';
import styles from './WatchCrates.module.css';

export default function CratesViews({root='',editionName='LOOG',current='read'}){
  return <nav className={styles.tabs} aria-label="The Crates views" style={current==='read'?{borderTop:0}:undefined}>
    <Link href={`${root}/archive`} aria-current={current==='read'?'page':undefined}>Read</Link>
    <Link href={`${root}/archive/watch`} aria-current={current==='watch'?'page':undefined}>Watch <span><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M5 2v16l13-8z"/></svg></span></Link>
    <span className={styles.edition}>{editionName} EDITION</span>
  </nav>;
}
