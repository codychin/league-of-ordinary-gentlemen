import { PCMPlayer, recordingType } from './audio.js';
const $ = id => document.getElementById(id);
const ui = Object.fromEntries(['mode','floor','cast','form','speaker','message','send','open','talk','interrupt','end','transcript','mic'].map(id => [id,$(id)]));
let config, token, context, player, operation, caption, recorder, stream, recordingTimer;
let generation = 0, holding = false, opening = false, ending = false, busy = false, recordingGeneration = 0;
const tell = text => { ui.floor.textContent = text; };
function controls() {
  const live = config?.mode === 'live-configured' && config.paidCallsEnabled === true;
  ui.open.hidden = !live; ui.open.disabled = !live || !!token || opening || ending;
  ui.talk.disabled = !token || busy || !window.MediaRecorder || !navigator.mediaDevices?.getUserMedia;
  ui.send.disabled = !config || busy || holding || ending || (live && !token);
  ui.speaker.disabled = !token || busy || holding;
  ui.interrupt.disabled = !token;
  ui.send.textContent = live ? 'Send to selected voice' : 'Rehearse a text turn';
}
function line(speaker, text, provisional = false) {
  const el = document.createElement('p'); el.className = provisional ? 'provisional' : '';
  const label = document.createElement('strong'); label.textContent = `${speaker}: `;
  const body = document.createElement('span'); body.textContent = text;
  const state = document.createElement('small'); state.textContent = provisional ? ' · provisional, not yet heard' : '';
  el.append(label, body, state); ui.transcript.append(el); return el;
}
function mark(el, text, provisional = false) { if (!el) return; el.className = provisional ? 'provisional' : ''; el.querySelector('small').textContent = text; }
async function api(path, body, options = {}) {
  const headers = { 'X-Room-Token': token || '', ...options.headers };
  if (body !== undefined && !(body instanceof Blob)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
  const response = await fetch(`/api/${path}`, { method:'POST', credentials:'same-origin', headers, body, ...options, headers });
  if (!response.ok) { let message = `Request failed (${response.status})`; try { const data = await response.json(); message = data.error || message; } catch {} throw new Error(message); }
  return response;
}
function releaseMedia() { clearTimeout(recordingTimer); stream?.getTracks().forEach(track => track.stop()); stream = undefined; ui.mic.textContent = 'Microphone off'; }
function stopLocal() {
  generation++; operation?.abort(); operation = undefined; player?.stop(); player = undefined;
  mark(caption, ' · interrupted / not confirmed heard', true); caption = undefined;
  holding = false; recordingGeneration++; if (recorder?.state === 'recording') recorder.stop(); recorder = undefined; releaseMedia(); busy = false; controls();
}
async function interrupt() {
  stopLocal(); tell('You have the floor. Playback and capture stopped.');
  if (token) { const epoch = generation; busy = true; controls(); try { await api('interrupt'); } catch (error) { tell(`Playback stopped locally. Server interrupt failed: ${error.message}`); } finally { if (epoch === generation) { busy = false; controls(); } } }
}
ui.open.onclick = async () => {
  opening = true; const epoch = generation; controls();
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('Web Audio is unavailable in this browser');
    context ||= new Audio(); await context.resume();
    const response = await api('open'); const opened = await response.json();
    if (epoch !== generation) { if (opened.token) await api('end', undefined, {headers:{'X-Room-Token':opened.token}}); return; }
    token = opened.token;
    if (!token) throw new Error('Room did not return a session token');
    tell('Room open. Choose a voice, then send a note or hold to talk.');
  } catch (error) { tell(error.message); } finally { opening = false; controls(); }
};
async function turn(text) {
  if (!text.trim()) return;
  line('Cody', text);
  if (!token) { tell('Text rehearsal only. No AI reply or audio was generated.'); return; }
  busy = true; controls(); const epoch = ++generation; operation = new AbortController();
  let turnId, done = false;
  try {
    await context.resume();
    if (context.state !== 'running') throw new Error('Audio is paused. Press Interrupt, then try again.');
    player = new PCMPlayer(context); const activePlayer = player;
    const response = await api('turn', {text, speaker:ui.speaker.value}, {signal:operation.signal});
    if (!response.body) throw new Error('Streaming response unavailable');
    const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = '';
    const receive = row => {
      if (!row.trim()) return; const event = JSON.parse(row);
      if (epoch !== generation) throw new DOMException('Interrupted','AbortError');
      if (event.type === 'error') throw new Error(event.error || event.message || 'Voice generation failed');
      if (event.type === 'start') {
        if (turnId) throw new Error('Unexpected repeated turn start');
        turnId = event.turnId;
        caption = line(config.cast[event.speaker]?.name || event.speaker, event.text, true);
      } else if (event.type === 'audio') {
        if (!turnId || done) throw new Error('Audio arrived out of order');
        activePlayer.append(event.data); tell('Playing response. You can interrupt at any time.');
      } else if (event.type === 'done') {
        if (event.turnId !== turnId || event.index !== 0 || done) throw new Error('Unexpected completion event');
        done = true;
      }
    };
    while (true) {
      const {value,done:ended} = await reader.read(); if (ended) break;
      pending += decoder.decode(value,{stream:true});
      let newline; while ((newline = pending.indexOf('\n')) >= 0) { receive(pending.slice(0,newline)); pending = pending.slice(newline+1); }
      if (pending.length > 2000000) throw new Error('Voice event too large');
    }
    pending += decoder.decode(); receive(pending);
    if (!done || !turnId) throw new Error('Incomplete voice stream');
    if (!await activePlayer.drain() || epoch !== generation) return;
    await api('heard', {turnId,index:0}, {signal:operation.signal});
    if (epoch !== generation) return;
    mark(caption, ' · playback completed'); caption = undefined; tell('Response finished. You have the floor.');
  } catch (error) {
    if (epoch !== generation) return;
    operation?.abort(); player?.stop(); mark(caption, ' · incomplete / not confirmed heard', true); caption = undefined;
    if (error.name !== 'AbortError') tell(`Could not complete the turn: ${error.message}`);
    try { await api('interrupt'); } catch {}
  } finally { if (epoch === generation) { busy = false; operation = undefined; player = undefined; controls(); } }
}
ui.form.onsubmit = event => { event.preventDefault(); if (busy || ui.send.disabled) return; const text = ui.message.value.trim(); if (!text) return; ui.message.value = ''; void turn(text); };
async function startRecording() {
  if (ui.talk.disabled || holding || busy) return;
  holding = true; controls(); const epoch = ++recordingGeneration;
  try {
    await context.resume();
    const obtained = await navigator.mediaDevices.getUserMedia({audio:true});
    if (!holding || epoch !== recordingGeneration) { obtained.getTracks().forEach(track => track.stop()); controls(); return; }
    stream = obtained; const type = recordingType(MediaRecorder); const chunks = [];
    const capture = new MediaRecorder(stream, type ? {mimeType:type} : undefined); recorder = capture;
    capture.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    capture.onerror = () => { stopLocal(); tell('Recording failed. Nothing was sent.'); };
    capture.onstop = async () => {
      if (epoch !== recordingGeneration) return; releaseMedia();
      recorder = undefined; holding = false; busy = true; controls();
      const requestEpoch = ++generation; operation = new AbortController();
      try {
        const blob = new Blob(chunks, {type:capture.mimeType || type});
        if (!blob.size) throw new Error('No audio captured');
        tell('Transcribing your recorded turn…');
        const result = await (await api('transcribe', blob, {headers:{'X-Audio-Type':blob.type,'Content-Type':blob.type || 'application/octet-stream'},signal:operation.signal})).json();
        if (requestEpoch !== generation) return;
        if (!result.text?.trim()) throw new Error('No speech was recognized');
        busy = false; await turn(result.text);
      } catch (error) { if (requestEpoch === generation && error.name !== 'AbortError') tell(`Recording was not sent as a turn: ${error.message}`); }
      finally { if (requestEpoch === generation) { busy = false; operation = undefined; controls(); } }
    };
    capture.start(); ui.mic.textContent = '● Recording'; tell('Recording while held. Release to send, or Interrupt to discard.');
    recordingTimer = setTimeout(finishRecording, 30000);
  } catch (error) { if (epoch !== recordingGeneration) return; holding = false; releaseMedia(); controls(); tell(`Microphone unavailable: ${error.message}`); }
}
function finishRecording() { holding = false; clearTimeout(recordingTimer); if (recorder?.state === 'recording') { busy = true; recorder.stop(); } controls(); }
ui.talk.onpointerdown = event => { if (event.button !== 0) return; event.preventDefault(); ui.talk.setPointerCapture(event.pointerId); void startRecording(); };
ui.talk.onpointerup = finishRecording; ui.talk.onpointercancel = () => { stopLocal(); tell('Recording cancelled.'); };
ui.talk.onkeydown = event => { if ((event.code === 'Space' || event.code === 'Enter') && !event.repeat) { event.preventDefault(); void startRecording(); } };
ui.talk.onkeyup = event => { if (event.code === 'Space' || event.code === 'Enter') { event.preventDefault(); finishRecording(); } };
ui.talk.onblur = () => { if (holding) { stopLocal(); tell('Recording cancelled when the talk button lost focus.'); } };
ui.interrupt.onclick = interrupt;
ui.end.onclick = async () => {
  if (ending) return; ending = true;
  stopLocal(); const oldToken = token; token = undefined; controls(); ui.transcript.replaceChildren(); ui.message.value = '';
  const oldContext = context; context = undefined; await oldContext?.close();
  try { if (oldToken) await api('end', undefined, {headers:{'X-Room-Token':oldToken}}); tell('Conversation cleared locally and room ended.'); }
  catch (error) { tell(`Conversation cleared locally. Server end could not be confirmed: ${error.message}`); }
  finally { ending = false; controls(); }
};
window.addEventListener('pagehide', () => {
  stopLocal(); if (token) fetch('/api/end',{method:'POST',headers:{'X-Room-Token':token},credentials:'same-origin',keepalive:true}).catch(()=>{});
  token = undefined; context?.close();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && token) void interrupt(); });
(async () => {
  try {
    const response = await fetch('/status',{cache:'no-store'}); if (!response.ok) throw new Error('Room status unavailable'); config = await response.json();
    const live = config.mode === 'live-configured' && config.paidCallsEnabled === true;
    ui.mode.textContent = live ? 'Live providers configured. Opening the room enables deliberate paid turns. Microphone stays off until you hold Talk.' : 'Offline interface rehearsal. No microphone, AI replies or speech calls. Text stays in this page until cleared.';
    for (const [id,person] of Object.entries(config.cast || {})) {
      const card = document.createElement('div'); card.className = 'person'; card.textContent = person.name; ui.cast.append(card);
      const option = document.createElement('option'); option.value = id; option.textContent = person.name; ui.speaker.append(option);
    }
    controls();
  } catch (error) { ui.mode.textContent = `${error.message}. Live controls remain disabled.`; }
})();
