import json,pathlib,subprocess,urllib.request,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1]
subprocess.run(['node',str(root/'scripts/check-week5-video-approvals.mjs')],cwd=root,check=True)\nvideos=json.loads((root/'scripts/week5-video-sources.json').read_text())
def run(*args): subprocess.run(args,check=True,stdout=subprocess.DEVNULL)
def package(v):
    vid=v['videoId']; source=pathlib.Path('/tmp')/(vid+'.mp4'); target=root/'public/reels'/(vid+'.mp4'); out=root/'public/reels-hls'/vid
    out.mkdir(parents=True,exist_ok=True)
    urllib.request.urlretrieve(v['videoUrl'],source)
    run('ffmpeg','-loglevel','error','-y','-i',str(source),'-map_metadata','-1','-vf','scale=720:-2','-c:v','libx264','-threads','2','-preset','fast','-crf','20','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-ar','48000','-movflags','+faststart',str(target))
    run('ffmpeg','-loglevel','error','-y','-ss','0.05','-i',str(target),'-frames:v','1','-q:v','3',str(out/'poster.jpg'))
    run('ffmpeg','-loglevel','error','-y','-i',str(target),'-c:v','libx264','-threads','2','-preset','fast','-profile:v','high','-level','4.0','-b:v','2200k','-maxrate','2600k','-bufsize','4400k','-g','60','-keyint_min','60','-sc_threshold','0','-c:a','aac','-b:a','128k','-ar','48000','-hls_time','2','-hls_playlist_type','vod','-hls_segment_type','fmp4','-hls_fmp4_init_filename','init.mp4','-hls_segment_filename',str(out/'seg_%03d.m4s'),str(out/'index.m3u8'))
    assert all(p.stat().st_size>0 for p in [target,out/'poster.jpg',out/'index.m3u8',out/'init.mp4',out/'seg_000.m4s'])
    print('Packaged '+v['title'],flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: list(pool.map(package,videos))

changes=json.loads((root/'scripts/week5-publication-files.json').read_text())
for path,content in changes.items(): (root/path).write_text(content)
