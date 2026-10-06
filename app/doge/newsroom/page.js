import Page from '../../components/editions/Newsroom';
import {getEditionConfig} from '../../../lib/edition-content';
export const dynamic='force-dynamic';
export default function Route(props){return <Page {...props} config={getEditionConfig('doge')}/>;}
