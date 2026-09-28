const banned=[/\bnull\b/i,/the headline is only useful if/i,/the useful question is not to cosplay as a doctor/i,/somewhere an august spreadsheet/i]
export function publishable(c:any){if(!c?.writer||!c?.subject||!c?.text)return false;if(c.text.length<100)return false;if(banned.some(r=>r.test(c.subject+' '+c.text)))return false;if(c.writer==='gannon'&&c.thread!=='LEAGUE LIVE'&&!(/\d/.test(c.text)&&/(target|carry|attempt|yard|catch|touch|snap|route|pressure|reception)/i.test(c.text)))return false;
if(c.thread==='LEAGUE LIVE'&&!c.evidence)return false;return true}
