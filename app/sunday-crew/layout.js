import {isStaging} from '../../lib/environment';
export const metadata = {
  applicationName: 'Sunday Crew',
  manifest: '/sunday-crew/manifest.webmanifest',
  appleWebApp: {capable: true, statusBarStyle: 'black-translucent', title: isStaging?'QA Sunday Crew':'Sunday Crew'},
};

export default function SundayCrewLayout({children}) {return children;}
