import json, pathlib, subprocess, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]

def run(*args):
    subprocess.run(args,check=True,stdout=subprocess.DEVNULL)

for video in json.loads((root/'scripts/week4-approved-recap-sources.json').read_text()):
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
start=s.index('const publishedReels=['); end=s.index('].map(([left,right,short,matchup,correspondent,avatar,id])=>{',start)
s=s[:start]+'''const publishedReels=[
  ['route-22','kraft','R22 · KRAFT','The Route 22 Clubhouse vs. For the Love of the Kraft','Maude Gannon',writers.gannon.image,'7f34018424eca5db9ec92b7a8c63d19d'],
  ['hopkins-opus','pollard-greens','HOP · POLL','Mr Hopkins Opus vs. Pollard Greens','Hollis Crane',writers.crane.image,'a8e34cf9eb4f6feb6fdbc4a2915293d6'],
  ['ceedeep','lloyd-rings','CEE · LLOYD','CeeDeep Shaheeded Rivalry vs. Lloyd of the Rings','Marnie Kells',writers.kells.image,'bc59f8b8b7f49b1d13532b9bd5ac352b'],
  ['royrek','shake-baker','ROY · SHAKE','Royrek Tishmeshulam vs. Shake ’N Baker','Sabine March',writers.march.image,'eb912530ce683f55ae9f704e9dc908db'],
  ['skatt','all-ugly','SKATT · UGLY','I’m a Skatt man vs. The All Ugly Team','Conrad Sorrell',writers.sorrell.image,'958c0c26787eed251648743bd726c4ae']
'''+s[end:]
s=s.replace('<ReelsShelf reels={publishedReels}/>','<ReelsShelf reels={publishedReels} releaseId="loog-week4-recap-v1" storageKey="brief-loog-week4-recap-viewed-v1" weekLabel="THE BRIEF • WEEK 4" title="Week 4, the aftermath." modeLabel="WEEK 4 • RECAP"/>')
p.write_text(s)
p=root/'app/sunday-crew/page.js';s=p.read_text()
for old,new in {'35be59702c0c7cca379ab5ca64c28788':'1c0b8905ec7c5a31173562cef17549cb','8710323881d0b2cb1ec55d3cd8137629':'835f2b6c72cdc34ffef914114ea02c79','4847ba749e3df2950b2c8c9d8a11308b':'5f0a8e1f3785065f12fbc71e99a668ba','2aabd81db067067020c873233c783454':'e35e3266d7177d3e2cbd09085ff85005','ffc21da84192b47902925f46c3635b04':'2982235e27369853455caa7d11a4c6e6','abc29d09e4dffce0486b7a92608e2414':'b0c6db2e5cab237055794b15f32f0c8f','week4-preview':'week4-recap','Week 4 previews.':'Week 4, the aftermath.','WEEK 4 • PREVIEW':'WEEK 4 • RECAP'}.items():s=s.replace(old,new)
p.write_text(s)
p=root/'app/components/ReelsShelf.jsx';s=p.read_text().replace('6 MATCHUPS • 6 CORRESPONDENTS','{reels.length} MATCHUPS • {new Set(reels.map(r=>r.correspondent)).size} CORRESPONDENTS');p.write_text(s)
p=root/'tests/release-integrity.test.mjs';s=p.read_text().replace('week4-preview','week4-recap');p.write_text(s)
print('All eleven packaged; shelves activated. Dashiell LOOG remains excluded.',flush=True)
