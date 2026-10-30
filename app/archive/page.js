import styles from '../components/Crates.module.css';
import Link from 'next/link';
import {archive} from '../articles/data';
import SiteNav from '../components/SiteNav';
import Crates from '../components/Crates';
import {crateArticle} from '../../lib/crates.mjs';
export const metadata={title:'The Crates • The Brief',description:'Good stories. Long shelf life. Explore the stories, voices and obsessions of The Brief.'};
export default function Archive(){return <><header className={`articleHeader ${styles.header}`}><Link href="/" className="miniMast">The Brief of Ordinary Gentleman</Link><SiteNav/></header><Crates articles={archive.map(a=>crateArticle(a))}/></>}
