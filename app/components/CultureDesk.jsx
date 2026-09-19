'use client'

import Link from 'next/link'
import {useState} from 'react'
import PreviewAuthor from './PreviewAuthor'

const PAGE_SIZE=5
const MEDIA='https://dnzdbqycuuoonewcowis.supabase.co/storage/v1/object/public/brief-media'

const stories=[
  {href:'/articles/kraft-sheeran-roster-overhaul',slug:'kraft-sheeran-roster-overhaul',image:'https://i.guim.co.uk/img/media/77dcd3dba91eefb7f7212db8cbde60b29ac0e1f3/0_0_3000_2285/master/3000.jpg?crop=none&dpr=1&s=none&width=1200',tag:'PERSONNEL & OWNERSHIP',title:'Robert Kraft Completes Ed Sheeran Roster Overhaul; Ed Sheeran Survives Final Cuts',dek:'The Loop Tour now has one performer, no opening acts and $5 million in newly discovered humanitarian cap space.',read:'REVIEW THE FINAL ROSTER →'},
  {href:'/articles/nigella-shake-n-baker',slug:'nigella-shake-n-baker',image:'/images/culture/nigella-shake-n-baker.webp',tag:'SELECTION COMMITTEE',title:"Nigella Lawson Joins Bake Off; Shake ’N Baker Thanks Committee for Its Consideration",dek:"Eating is her superpower. Shake ’N Baker says the process was competitive and wishes all parties continued success.",read:'REVIEW THE APPOINTMENT →'},
  {href:'/articles/sydney-sweeney-consensus',slug:'sydney-sweeney-consensus',image:'/images/culture/sydney-sweeney-consensus.webp',tag:'UNANIMOUS CONSENT',title:'Sydney Sweeney Sports Ad Divides Nation; League Reaches Consensus in Record Time',dek:'A provocative campaign produced nationwide disagreement and the fastest unanimous decision in league history.',read:'REVIEW THE CONSENSUS →'},
  {href:'/articles/upper-east-side-froyo',slug:'upper-east-side-froyo',photoClass:'froyoPhoto',tag:'MUNICIPAL AFFAIRS',title:'Upper East Side Residents Discover Waiting in Line; League Office Monitoring for Possible Waiver Implications',dek:"Mimi's has introduced crowd-control infrastructure to Lexington Avenue. Big Citrus has not been formally implicated.",read:'REVIEW THE CIVIC EMERGENCY →'},
  {photoClass:'swiftPhoto',tag:'CELEBRITY PERSONNEL',title:'Taylor Swift, Tom Cruise Attend Chiefs Game; Route 22 Has Already Asked What It Would Take',dek:"The two were seated together at Arrowhead Monday night. Choe and Gerstone have not confirmed contact, though the Clubhouse's recent transaction volume makes a formal denial advisable."},
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
