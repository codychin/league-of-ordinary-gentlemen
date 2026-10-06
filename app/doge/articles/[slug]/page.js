import Article from '../../../components/editions/Article';
import {getEditionConfig} from '../../../../lib/edition-content';
export {generateMetadata} from '../../../articles/[slug]/page';
export const dynamic='force-dynamic';
export default function Page(props){return <Article {...props} config={getEditionConfig('doge')}/>;}
