import Home from '../components/editions/Home';
import {getEditionConfig} from '../../lib/edition-content';
export const dynamic='force-dynamic';
export default function Page(){return <Home config={getEditionConfig('doge')}/>;}
