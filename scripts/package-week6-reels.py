import json,pathlib,re,subprocess,urllib.request,concurrent.futures
R=pathlib.Path(__file__).resolve().parents[1]
items=json.loads((R/'data/week6-approved-preview-manifest.json').read_text())
urls={v['id']:v['url'] for v in json.loads((R/'scripts/week6-staging-video-sources.json').read_text())}
assert len(items)==18 and len(urls)==18
def run(*args):subprocess.run(args,check=True,stdout=subprocess.DEVNULL)
def pack(v):
 id=v['id']; src=pathlib.Path('/tmp')/(id+'.mp4'); dst=R/'public/reels'/(id+'.mp4'); out=R/'public/reels-hls'/id
 dst.parent.mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
 urllib.request.urlretrieve(urls[id],src)
 run('ffmpeg','-loglevel','error','-y','-i',str(src),'-map_metadata','-1','-vf','scale=720:-2','-c:v','libx264','-threads','2','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-movflags','+faststart',str(dst))
 run('ffmpeg','-loglevel','error','-y','-ss','0.1','-i',str(dst),'-frames:v','1','-q:v','3',str(out/'poster.jpg'))
 run('ffmpeg','-loglevel','error','-y','-i',str(dst),'-c:v','libx264','-threads','2','-preset','fast','-profile:v','high','-level','4.0','-b:v','2200k','-maxrate','2600k','-bufsize','4400k','-g','60','-keyint_min','60','-sc_threshold','0','-c:a','aac','-b:a','128k','-hls_time','2','-hls_playlist_type','vod','-hls_segment_type','fmp4','-hls_fmp4_init_filename','init.mp4','-hls_segment_filename',str(out/'seg_%03d.m4s'),str(out/'index.m3u8'))
 assert all(p.stat().st_size>0 for p in [dst,out/'poster.jpg',out/'index.m3u8',out/'init.mp4',out/'seg_000.m4s'])
 print('packaged',id,flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:list(pool.map(pack,items))

print('All 18 approved Week 6 assets packaged',flush=True)
