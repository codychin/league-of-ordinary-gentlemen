'use client'

import {useState} from 'react'

const PUSH_API='https://dnzdbqycuuoonewcowis.supabase.co/functions/v1/brief-push'
const fieldStyle={display:'block',width:'100%',padding:10}
const formStyle={display:'grid',gap:14,paddingBottom:32,borderBottom:'1px solid #aaa'}

export default function MediaAdmin(){
  const [mediaStatus,setMediaStatus]=useState('')
  const [alertStatus,setAlertStatus]=useState('')
  const [sendingAlert,setSendingAlert]=useState(false)

  async function upload(event){
    event.preventDefault()
    setMediaStatus('Uploading…')
    const form=new FormData(event.currentTarget)
    const key=form.get('key')
    form.delete('key')
    const response=await fetch('/api/media',{method:'POST',headers:{'x-brief-media-key':key},body:form})
    const result=await response.json().catch(()=>({error:'Upload failed'}))
    setMediaStatus(response.ok?`Uploaded: ${result.url}`:`Error: ${result.error||response.status}`)
  }

  async function sendAlert(event){
    event.preventDefault()
    if(sendingAlert)return
    setSendingAlert(true)
    setAlertStatus('Sending…')
    const form=new FormData(event.currentTarget)
    try{
      const response=await fetch(`${PUSH_API}?action=send`,{
        method:'POST',
        headers:{'Content-Type':'application/json','x-brief-media-key':String(form.get('key')||'')},
        body:JSON.stringify({articleId:form.get('articleId'),title:form.get('title'),body:form.get('body')}),
      })
      const result=await response.json().catch(()=>({error:'Alert failed'}))
      setAlertStatus(response.ok?`Sent to ${result.sent} subscriber${result.sent===1?'':'s'}${result.failed?`; ${result.failed} failed`:''}.`:`Error: ${result.error||response.status}`)
    }catch{
      setAlertStatus('Error: The alert service could not be reached.')
    }finally{
      setSendingAlert(false)
    }
  }

  return <main style={{maxWidth:680,margin:'60px auto',padding:24,fontFamily:'Arial,sans-serif'}}>
    <h1>The Brief — Editorial Desk</h1>
    <h2>Media</h2>
    <p>The key is sent only to the server and is not stored by this page.</p>
    <form onSubmit={upload} style={formStyle}>
      <label>Editorial key<input name="key" type="password" required style={fieldStyle}/></label>
      <label>Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required style={{display:'block'}}/></label>
      <label>Folder<input name="folder" defaultValue="culture" required style={fieldStyle}/></label>
      <label>Filename<input name="filename" placeholder="mitch-voit.png" required style={fieldStyle}/></label>
      <button type="submit" style={{padding:12,fontWeight:700}}>Upload to The Brief</button>
    </form>
    <p style={{marginTop:14,wordBreak:'break-all'}}>{mediaStatus}</p>

    <h2 style={{marginTop:42}}>Article alert</h2>
    <p>Send only after the article is live in production. Each article slug can notify subscribers once.</p>
    <form onSubmit={sendAlert} style={formStyle}>
      <label>Editorial key<input name="key" type="password" required style={fieldStyle}/></label>
      <label>Article slug<input name="articleId" placeholder="league-unbearable-tnf" pattern="[a-z0-9-]+" required style={fieldStyle}/></label>
      <label>Notification title<input name="title" maxLength={120} required style={fieldStyle}/></label>
      <label>Notification body<textarea name="body" maxLength={240} required style={{...fieldStyle,minHeight:90}}/></label>
      <button type="submit" disabled={sendingAlert} style={{padding:12,fontWeight:700}}>{sendingAlert?'Sending…':'Send article alert'}</button>
    </form>
    <p style={{marginTop:14}}>{alertStatus}</p>
  </main>
}
