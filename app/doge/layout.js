import {isStaging} from '../../lib/environment';
export const metadata={title:'The DOGE Dispatch',applicationName:'DOGE4',manifest:'/doge/manifest.webmanifest',appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:isStaging?'QA DOGE4':'DOGE4'}};
export default function Layout({children}){return children;}
