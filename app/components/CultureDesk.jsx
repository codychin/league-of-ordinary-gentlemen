'use client'

import Link from 'next/link'
import {useState} from 'react'
import PreviewAuthor from './PreviewAuthor'

const PAGE_SIZE=5
const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media'

const stories=[
  {href:'/articles/marnie-jumbotron-juilliard',slug:'marnie-jumbotron-juilliard',image:'/api/preston-powe-image',tag:'FAME & ATTENTION',title:'The Jumbotron Is the New Juilliard',dek:'The audition has escaped the casting room and entered the arena of popular response.',read:'ENTER THE CASTING ROOM →'},
  {href:'/articles/sabine-michigan-money-privilege-impatience',slug:'sabine-michigan-money-privilege-impatience',image:'/api/jolin-ellison-image',tag:'MONEY & INSTITUTIONS',title:'Michigan, Money and the Privilege of Impatience',dek:'Jolin Ellison represents a new kind of college-football power broker. The uncomfortable question is whether institutions need people like her.',read:'READ THE DISPATCH →'},
  {href:'/articles/dashiell-favorite-team-asset-class',slug:'dashiell-favorite-team-asset-class',image:'/api/dashiell-london-fans-image',tag:'CAPITAL & FANDOM',title:'When Your Favorite Team Became an Asset Class',dek:'Sports spent a century as an exception to economic pragmatism. The mean is reverting.',read:'FOLLOW THE MONEY →'},
  {href:'/articles/marnie-manifest-destiny-wembley',slug:'marnie-manifest-destiny-wembley',image:'https://i.guim.co.uk/img/media/207bbaba9e6c039a17a05147f2ecc136c6a2a859/0_0_5605_3819/master/5605.jpg?crop=none&dpr=1&s=none&width=1200',tag:'AMERICAN EXPORTS',title:'Manifest Destiny Has Reached the Jubilee Line',dek:'America sent 15,000 fans, marching bands, cheerleaders, an electric-guitar anthem and a fake Britain to Britain. Wembley never had a chance.',read:'REVIEW THE OCCUPATION →'},
  {href:'/articles/sabine-chest-statement',slug:'sabine-chest-statement',image:'/api/sabine-march.jpg',photoClass:'sabineCulturePhoto',tag:'PUBLIC STATEMENT',title:'Sabine March Addresses Ongoing Chest Speculation Without Resolving the Central Question',dek:'Measurements were declined. An independent review will not be commissioned. The public remains free to reach its own conclusions.',read:'READ THE STATEMENT →'},
  {href:'/articles/marnie-colorado-content-football',slug:'marnie-colorado-content-football',image:'https://images2.minutemediacdn.com/image/upload/c_crop%2Cx_416%2Cy_0%2Cw_2783%2Ch_1565/c_fill%2Cw_1200%2Car_16%3A9%2Cf_auto%2Cq_auto%2Cg_auto/images/ReutersImages/mmsport/buffs_beat/01m2ybgqcd9qcbryd2tv.jpg',tag:'COLLEGE FOOTBALL',title:'Colorado Loses 41–7, Continues Difficult Transition From Content to Football',dek:'Four turnovers, nine penalties and one afternoon that did not improve in the edit.',read:'REVIEW THE DAMAGE →'},
  {href:'/articles/marnie-tilly-cantonese',slug:'marnie-tilly-cantonese',image:'https://i.ytimg.com/vi/x4yyBWkYSHs/maxresdefault.jpg',tag:'MACHINE RELATIONS',title:'Hollywood’s AI Actress Glitched Into Cantonese and Continued the Press Tour',dek:'Tilly Norwood briefly switched languages on Piers Morgan. The publication written by robots has requested everyone remain calm.',read:'REVIEW THE MALFUNCTION →'},
  {href:'/articles/marnie-cruise-swift-football',slug:'marnie-cruise-swift-football',photoClass:'swiftPhoto',tag:'FILM STUDIES',title:'Tom Cruise Learns Football From Taylor Swift; Top Gun Beach Scene Now Under Formal Review',dek:'Cruise says Swift was teaching him football at Arrowhead. Several decades of cinematic evidence are being reopened.',read:'REVIEW THE GAME FILM →'},
  {href:'/articles/kraft-sheeran-roster-overhaul',slug:'kraft-sheeran-roster-overhaul',image:'https://i.guim.co.uk/img/media/77dcd3dba91eefb7f7212db8cbde60b29ac0e1f3/0_0_3000_2285/master/3000.jpg?crop=none&dpr=1&s=none&width=1200',tag:'PERSONNEL & OWNERSHIP',title:'Robert Kraft Completes Ed Sheeran Roster Overhaul; Ed Sheeran Survives Final Cuts',dek:'The Loop Tour now has one performer, no opening acts and $5 million in newly discovered humanitarian cap space.',read:'REVIEW THE FINAL ROSTER →'},
  {href:'/articles/nigella-shake-n-baker',slug:'nigella-shake-n-baker',image:'/images/culture/nigella-shake-n-baker.webp',tag:'SELECTION COMMITTEE',title:"Nigella Lawson Joins Bake Off; Shake ’N Baker Thanks Committee for Its Consideration",dek:"Eating is her superpower. Shake ’N Baker says the process was competitive and wishes all parties continued success.",read:'REVIEW THE APPOINTMENT →'},
  {href:'/articles/sydney-sweeney-consensus',slug:'sydney-sweeney-consensus',image:'/images/culture/sydney-sweeney-consensus.webp',tag:'UNANIMOUS CONSENT',title:'Sydney Sweeney Sports Ad Divides Nation; League Reaches Consensus in Record Time',dek:'A provocative campaign produced nationwide disagreement and the fastest unanimous decision in league history.',read:'REVIEW THE CONSENSUS →'},
  {href:'/articles/upper-east-side-froyo',slug:'upper-east-side-froyo',photoClass:'froyoPhoto',tag:'MUNICIPAL AFFAIRS',title:'Upper East Side Residents Discover Waiting in Line; League Office Monitoring for Possible Waiver Implications',dek:"Mimi's has introduced crowd-control infrastructure to Lexington Avenue. Big Citrus has not been formally implicated.",read:'REVIEW THE CIVIC EMERGENCY →'},
  {photoClass:'spongePhoto',tag:'BROOKLYN BUREAU',title:'Pregnant SpongeBob Rave Held in Brooklyn Without Prior Approval From League Office',dek:'A sold-out event involving SpongeBob, Final Fantasy, Kingdom Hearts and male pregnancy proceeded despite no apparent connection to fantasy football. Bonanz remains, for now, uninvolved.'},
  {photoClass:'knicksPhoto',tag:'FASHION & COMMERCE',title:'Knicks Attend Tommy Hilfiger Show at Plaza; Big Citrus Not Among Those Photographed',dek:"Josh Hart, Miles McBride and Karl-Anthony Towns appeared at the New York Fashion Week event. Sherm's absence from published photographs has not been explained."},
  {image:`${MEDIA}/culture/mitch-voit.png`,tag:'BASEBALL DESK',title:'Mitch Voit Appears Increasingly Alien-Like; League Declines to Investigate Further',dek:'The latest broadcast image has renewed questions nobody with jurisdiction intends to answer. The League Office reviewed the matter and found no fantasy-football implications at this time.'}
]

function Story({story}){
  const body=<><div className={`culturePhoto ${story.photoClass||''}`} style={story.image?{backgroundImage:`url('${story.image}')`}:undefined}/><div className="tag">{story.tag}</div><h3>{story.title}</h3>{story.slug&&<PreviewAuthor slug={story.slug}/>}<p>{story.dek}</p>{story.read&&<div className="read">{story.read}</div>}</>
  return story.href?<Link href={story.href} className="card storylink">{body}</Link>:<article className="card">{body}</article>
}

export default function CultureDesk(){
  const [page,setPage]=useState(0)
  const pageCount=Math.ceil(stories.length/PAGE_SIZE)
  const visible=stories.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE)
  const changePage=next=>{setPage(next);document.getElementById('culture')?.scrollIntoView({behavior:'auto',block:'start'})}
  return <section className="affairs" id="culture"><div className="sectionhead light affairsHead"><span>CULTURE DESK</span><h2>Matters of Culture</h2></div><div className="affairsIntro">Important to someone.</div><div className="grid3 darkgrid cultureGrid">{visible.map((story,index)=><Story story={story} key={`${page}-${index}`}/>)}</div>{pageCount>1&&<nav className="culturePagination" aria-label="Culture stories pagination"><button type="button" onClick={()=>changePage(page-1)} disabled={page===0}>← NEWER</button><span>PAGE {page+1} OF {pageCount}</span><button type="button" onClick={()=>changePage(page+1)} disabled={page===pageCount-1}>OLDER →</button></nav>}</section>
}
