import './globals.css'
import './v2.css'
import './polish.css'
import './wire.css'
import './editorial-pass.css'
import './home-pass.css'
import './culture-pagination.css'
import './dossier.css'
import './matchups.css'
import './pwa.css'
import './staff.css'
import './culture-fixes.css'
import './share.css'
import PwaShell from './components/PwaShell'

export const metadata={
  title:'The Brief of Ordinary Gentleman',
  description:'Sports, culture and investigations from the League of Ordinary Gentlemen',
  applicationName:'The Brief',
  manifest:'/manifest.webmanifest',
  formatDetection:{telephone:false},
  appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'The Brief'},
  icons:{
    icon:[
      {url:'/icons/ordinary-brief-v3-32.png',sizes:'32x32',type:'image/png'},
      {url:'/icons/ordinary-brief-v3-192.png',sizes:'192x192',type:'image/png'},
      {url:'/icons/ordinary-brief-v3-512.png',sizes:'512x512',type:'image/png'},
    ],
    apple:[{url:'/icons/apple-touch-icon-v3.png',sizes:'180x180',type:'image/png'}],
  },
}

export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#11100e'}

const standaloneBoot=`try{var q=new URLSearchParams(location.search),preview=q.get('app-preview')==='1';if(preview||matchMedia('(display-mode: standalone)').matches||navigator.standalone===true){document.documentElement.classList.add('standaloneApp');if(preview)document.documentElement.classList.add('appPreview');var p=location.pathname,h=location.hash,t=q.get('tab');document.documentElement.dataset.appTab=p.startsWith('/teams')?'teams':p.startsWith('/matchups')?'scores':p!=='/'?(['/staff','/archive','/corrections'].some(function(x){return p.startsWith(x)})?'more':'detail'):(t==='scores'||t==='culture'||t==='home'?t:h==='#scores'?'scores':h==='#culture'?'culture':'home')}}catch(e){}`

export default function RootLayout({children}){return <html lang="en"><head><script id="standalone-boot" dangerouslySetInnerHTML={{__html:standaloneBoot}}/></head><body>{children}<PwaShell/></body></html>}
