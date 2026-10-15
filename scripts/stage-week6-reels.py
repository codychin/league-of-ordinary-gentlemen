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
icons={'Hollis Crane':'crane','Conrad Sorrell':'sorrell','Maude Gannon':'gannon','Dashiell Pike':'pike','Marnie Kells':'kells','Sabine March':'march'}
slug={'The All Ugly Team':'all-ugly','CeeDeep Shaheeded Rivalry':'ceedeep','DarkHorse Danir':'danir','The Route 22 Clubhouse':'route-22',"I'm a Skatt man":'skatt','Mr Hopkins Opus':'hopkins-opus','Lloyd of the Rings':'lloyd-rings','Kupp Kupp Doubs':'kupp-doubs',"Shake 'N Baker":'shake-baker','Pollard Greens':'pollard-greens','Royrek Tishmeshulam':'royrek','For the Love of the Kraft':'kraft'}
def desc(v):return v['left']+' vs. '+v['right']
loog=[v for v in items if v['league']=='loog']
p=R/'app/page.js';s=p.read_text();start=s.index('const publishedReels=[');end=s.index('].map(([left,right,short,matchup,correspondent,avatar,id])=>{',start)
rows=[]
for v in loog:
 a,b=slug[v['left']],slug[v['right']]
 rows.append('  '+json.dumps([a,b,(a+' · '+b).upper(),desc(v),v['correspondent']],ensure_ascii=False)[:-1]+',writers.'+icons[v['correspondent']]+'.image,'+json.dumps(v['id'])+'],')
s=s[:start]+'const publishedReels=[\n'+ '\n'.join(rows)+'\n'+s[end:]
s=re.sub(r'releaseId="loog-week[^"]+"', 'releaseId="loog-week6-preview-v1"',s);s=re.sub(r'storageKey="brief-loog-week[^"]+"','storageKey="brief-loog-week6-preview-viewed-v1"',s);s=s.replace('title="Week 4, the aftermath."','title="Week 6, the previews."').replace('title="Week 5, the recap."','title="Week 6, the previews."')
s=re.sub(r'weekLabel="THE BRIEF • WEEK [0-9]+"','weekLabel="THE BRIEF • WEEK 6"',s);s=re.sub(r'modeLabel="WEEK [0-9]+ • [A-Z]+"','modeLabel="WEEK 6 • PREVIEWS"',s)
p.write_text(s)
mapping={'sunday-crew':('sunday-reels.js',{'ZAYWATCH':'1','A Stroke of Bad Luck':'2','Rhamondre - A Cautionary Tale':'3','Croatian Sensation':'4','Forte inch Ditka':'5',"It's always sunny in ALLENtown":'6','J Bird':'7','Wake Me Up On September 1st':'8','Scrump':'9','CHANE GANG':'10',"Tolbert's Cookies":'11','RBs are Overrated':'12'}),'doge':('doge-reels.js',{"Caleb's Elite Touch Rate":'1','Gimothy Blossoms':'2',"RFK Jr's Bears":'3','El Niño Grande':'4',"Jerruh's World":'5','McConkey Kong':'6','Tranimal':'7','T. Ocellus':'8','Extremely Tight Ends':'9',"De'Coldest Hassan":'10','Ordway and Son':'11','Nix in 5':'12'})}
for league,(file,lookup) in mapping.items():
 out=["import {writers} from '../app/articles/writers';",f"export const {'sundayReels' if league=='sunday-crew' else 'dogeReels'}=["]
 for v in [v for v in items if v['league']==league]:
  prefix='470.l.197826.t.' if league=='sunday-crew' else '470.l.226614.t.'
  data=dict(id=v['id'],leftKey=prefix+lookup[v['left']],rightKey=prefix+lookup[v['right']],short=v['left']+' · '+v['right'],matchup=desc(v),correspondent=v['correspondent'])
  out.append('  {'+','.join(k+':'+json.dumps(val,ensure_ascii=False) for k,val in data.items())+',avatar:writers.'+icons[v['correspondent']]+'.image},')
 out.append('];')
 (R/'lib'/file).write_text('\n'.join(out)+'\n')
p=R/'lib/edition-content.js';s=p.read_text();s=re.sub(r"reelRelease:'doge-week[^']+'","reelRelease:'doge-week6-preview-v1'",s);s=re.sub(r"reelStorage:'brief-doge-week[^']+'","reelStorage:'brief-doge-week6-preview-viewed-v1'",s);s=re.sub(r"reelLabel:'DOGE4 • WEEK [^']+'","reelLabel:'DOGE4 • WEEK 6 • PREVIEWS'",s);s=re.sub(r"reelTitle:'[^']+'","reelTitle:'Week 6, the previews.'",s)
s=re.sub(r"reelRelease:'sunday-crew-week[^']+'","reelRelease:'sunday-crew-week6-preview-v1'",s);s=re.sub(r"reelStorage:'brief-sunday-crew-week[^']+'","reelStorage:'brief-sunday-crew-week6-preview-viewed-v1'",s);s=re.sub(r"reelLabel:'SUNDAY CREW • WEEK [^']+'","reelLabel:'SUNDAY CREW • WEEK 6 • PREVIEWS'",s);p.write_text(s)
print('18 videos packaged; Week 6 staging listings written',flush=True)
