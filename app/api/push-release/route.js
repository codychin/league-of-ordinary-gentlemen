import {NextResponse} from 'next/server'
import {articles} from '../../articles/data'
import {pushRelease} from '../../push-release'

const PUSH_API='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-push'
const SITE_ORIGIN='https://www.ordinarybrief.com'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function POST(){
  const key=process.env.BRIEF_MEDIA_UPLOAD_KEY
  if(!key) return NextResponse.json({error:'Push delivery is not configured'},{status:503})

  const article=articles[pushRelease.articleId]
  if(!article) return NextResponse.json({error:'The configured push article does not exist'},{status:500})

  let image
  if(article.image){
    try{image=new URL(article.image,SITE_ORIGIN).href}catch{return NextResponse.json({error:'The article image URL is invalid'},{status:500})}
  }

  try{
    const response=await fetch(`${PUSH_API}?action=send`,{
      method:'POST',
      headers:{'Content-Type':'application/json','x-brief-media-key':key},
      body:JSON.stringify({...pushRelease,image,homepage:true}),
      cache:'no-store',
    })
    const result=await response.json().catch(()=>({error:'Push service returned an invalid response'}))
    return NextResponse.json(result,{status:response.status})
  }catch{
    return NextResponse.json({error:'The push service could not be reached'},{status:502})
  }
}
