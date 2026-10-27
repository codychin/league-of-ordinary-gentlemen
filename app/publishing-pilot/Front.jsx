import Link from 'next/link';
import front from '../components/SharedEditorialFront.module.css';
import ResilientImage from '../components/ResilientImage';
import PreviewAuthor from '../components/PreviewAuthor';
import {imageBackground} from '../../lib/editorial-images';
import LegacyOverflow from './LegacyOverflow';
const presentation={
 'conrad-allow-me-to-reintroduce-myself':{byline:'CONRAD SORRELL • COLUMN',theme:'AN EXCELLENT CANDIDATE'},
 'marnie-delicate-etiquette-sporting-pat':{byline:'MARNIE KELLS • CULTURE',theme:'GOOD INTENTIONS',image:'/images/editorial/allen-wolfson-interview-thumbnail.jpg',alt:'Josh Allen speaks with Tracy Wolfson during a postgame interview.',position:'center'},
 'conrad-jalen-hurts-too-sick-to-sleep':{byline:'CONRAD SORRELL • COLUMN',theme:'WHEN MEDICAL CLEARANCE BECOMES NEGOTIABLE',position:'center 30%'},
 'hollis-rams-kicker-weight':{byline:'HOLLIS CRANE • INVESTIGATIONS',theme:'A CONSIDERABLE REDUCTION IN PERSONNEL',position:'center 40%'}
};
function label(p){return <div className="actionCaption"><small>{p.byline}</small><b>{p.theme}</b></div>}
export default function Front({snapshot,root,revisionQuery=""}){
 const [lead,...rest]=snapshot.home,a=snapshot.articles[lead],p=presentation[lead]||presentation['conrad-allow-me-to-reintroduce-myself'];
 const url=slug=>root+'/articles/'+slug+revisionQuery;
 const card=(slug,overflow=false)=>{const a=snapshot.articles[slug],p=presentation[slug]||presentation['conrad-allow-me-to-reintroduce-myself'];return <article key={slug} data-story={slug} className={overflow?'hero heroStack':front.card}><Link prefetch={false} className={front.story} href={url(slug)}><div className={front.image} role="img" aria-label={p.alt||a.imageAlt||''} style={{backgroundImage:imageBackground(p.image||a.image,640),backgroundPosition:p.position||a.imageObjectPosition||'center'}}>{label(p)}</div><div className="eyebrow">{a.section}</div><h3>{a.title}</h3><PreviewAuthor slug={presentation[slug]?slug:"conrad-allow-me-to-reintroduce-myself"}/><p className={front.dek}>{a.dek}</p><div className="read">READ {p.byline.split(' ')[0]} →</div></Link></article>};
 return <><section className="morningBriefPreview sundayFront" style={{paddingTop:0}} aria-label={'Lead story: '+a.title} data-story={lead}><div className="morningBriefFlag"><span>THE BRIEF • LEAD STORY</span><small>CONRAD SORRELL • OCTOBER 21</small></div><div className="sundayFrontGrid"><article className="sundayFeature sabinePackage"><Link prefetch={false} href={url(lead)} className={`sundayFeatureImage storylink ${front.tourHero}`}><ResilientImage loading="eager" decoding="async" src={a.image} style={{objectPosition:a.imageObjectPosition}} alt={a.imageAlt}/>{label(p)}</Link><div className="sundayFeatureCopy"><div className="sabinePackageIntro"><small>{a.section}</small><Link prefetch={false} href={url(lead)} className="sabinePackageTitle storylink"><h2>{a.title}</h2></Link><p className={front.leadDek}>{a.dek}</p><PreviewAuthor slug={presentation[lead]?lead:"conrad-allow-me-to-reintroduce-myself"}/></div><Link prefetch={false} href={url(lead)} className="sabinePackageCta">READ CONRAD →</Link></div></article></div></section>
 <section className={front.recent} aria-label="Recent stories">{rest.slice(0,3).map(s=>card(s))}</section>
 {rest.slice(3).map(slug=>presentation[slug]?card(slug,true):<div key={slug} data-story={slug}><LegacyOverflow slug={slug} root={root} revisionQuery={revisionQuery}/></div>)}
 <Link prefetch={false} href={root+'/archive'+revisionQuery}>BROWSE THE ARCHIVE →</Link></>;
}
