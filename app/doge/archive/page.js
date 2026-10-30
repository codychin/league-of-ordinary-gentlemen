import Page from '../../components/editions/Archive';
import {getEditionConfig} from '../../../lib/edition-content';
export const metadata={title:'The Crates • The Brief'};
export const dynamic='force-dynamic';
export default function Route(props){return <Page {...props} config={getEditionConfig('doge')}/>;}
