import './globals.css'
import './v2.css'
import './polish.css'
import './wire.css'
import './editorial-pass.css'
import './home-pass.css'
import './culture-pagination.css'
import './dossier.css'
import './pwa.css'
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
      {url:'/icons/ordinary-brief-32.png',sizes:'32x32',type:'image/png'},
      {url:'/icons/ordinary-brief-192.png',sizes:'192x192',type:'image/png'},
      {url:'/icons/ordinary-brief-512.png',sizes:'512x512',type:'image/png'},
    ],
    apple:[{url:'/icons/apple-touch-icon.png',sizes:'180x180',type:'image/png'}],
  },
}

export const viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#11100e'}

export default function RootLayout({children}){return <html lang="en"><body>{children}<PwaShell/></body></html>}
