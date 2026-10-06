import json, pathlib, subprocess, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]

def run(*args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL)

for video in json.loads((root/'scripts/dashiell-approved-source.json').read_text()):
    vid=video['id']; source=pathlib.Path('/tmp')/(vid+'.mp4')
    out=root/'public/reels-hls'/vid; out.mkdir(parents=True,exist_ok=True)
    target=root/'public/reels'/(vid+'.mp4')
    print('Packaging',vid,flush=True)
    urllib.request.urlretrieve(video['url'],source)
    run('ffmpeg','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-vf','scale=720:-2','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(target))
    run('ffmpeg','-loglevel','error','-y','-ss','0.05','-i',str(target),'-frames:v','1','-q:v','3',str(out/'poster.jpg'))
    run('ffmpeg','-loglevel','error','-y','-i',str(target),'-c:v','libx264','-preset','fast','-profile:v','high','-level','4.0','-b:v','2200k','-maxrate','2600k','-bufsize','4400k','-g','60','-keyint_min','60','-sc_threshold','0','-c:a','aac','-b:a','128k','-ar','48000','-hls_time','2','-hls_playlist_type','vod','-hls_segment_type','fmp4','-hls_fmp4_init_filename','init.mp4','-hls_segment_filename',str(out/'seg_%03d.m4s'),str(out/'index.m3u8'))
    for p in [target,out/'poster.jpg',out/'index.m3u8',out/'init.mp4',out/'seg_000.m4s']:
        assert p.stat().st_size>0,p

p=root/'app/page.js'; s=p.read_text()
vid='284ffa740e45c0f9873a164fe18435ba'
if vid not in s:
    anchor="  ['ceedeep','lloyd-rings'"
    assert s.count(anchor)==1
    entry="  ['danir','kupp-doubs','DANIR · KUPP','DarkHorse Danir vs. Kupp Kupp Doubs','Dashiell Pike',writers.pike.image,'"+vid+"'],\n"
    s=s.replace(anchor,entry+anchor)
    p.write_text(s)
print('Approved Dashiell reel packaged and added.',flush=True)
