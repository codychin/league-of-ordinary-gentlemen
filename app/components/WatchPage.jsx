import Link from 'next/link';
import SiteNav from './SiteNav';
import EditionSiteNav from './EditionSiteNav';
import WatchCrates from './WatchCrates';
import {watchLibrary} from '../../lib/watch-library';
import styles from './Crates.module.css';
export default function WatchPage({edition='loog',root='',name='LOOG'}){
 return <><header className={`articleHeader ${styles.header}`}><Link href={root||'/'} className="miniMast">The Brief</Link>{root?<EditionSiteNav root={root}/>:<SiteNav/>}</header><WatchCrates {...watchLibrary(edition)} root={root} editionName={name}/></>;
}
