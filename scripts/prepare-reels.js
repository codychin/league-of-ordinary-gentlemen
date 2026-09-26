const fs=require('fs');
const path=require('path');
const {spawnSync}=require('child_process');
const ffmpeg=require('ffmpeg-static');

const reels={
  '392481b81c933a1c16c0681d80094e25':'https://files2.heygen.ai/aws_pacific/avatar_tmp/88574ea85d0040b2a2836001c97400ea/392481b81c933a1c16c0681d80094e25.mp4?Expires=1790969644&Signature=azSQ4suGD2UCf0aPyzNtJmyExjKowgyQ7gPzgljsoZVhilAGlkBC2i-e861xAuHEGv86I-y~jH5cGEbEuCHOLKIjFToK35MW69aYQ5mj8AAJ87bM2nE2R4V1kV7R0La5XFhJ1LGvLNMIX1dRtXLGwoirNHwsXEbGD~o6E~8qseEpsEqiI-UGEPYgcNlOCvrOkz1k8b85gndLCn3Pc94mhyHja4A2Yk1aKmaaeefJdvktsgEaQ4fMEs4ar15hHuyIeUbHCOAqFD6faLksmklU~~Q~YnQcKZIPVBDH3YDlH1mF99vBJAuws50kHRbMUHt65fDbkBWVBnsA52BouD1NdQ__&Key-Pair-Id=K38HBHX5LX3X2H',
  'cd532bffc3dce227f11f04663439e4d9':'https://files2.heygen.ai/aws_pacific/avatar_tmp/88574ea85d0040b2a2836001c97400ea/cd532bffc3dce227f11f04663439e4d9.mp4?Expires=1790979733&Signature=N5cFOrzhIWxl9QAYf4wWiTAq7rHTt1z2CpYccBWHRUtpmxVc2Jyp1sndVGq3wDpHguHcZAiMrqIn1V~Qn9xMTGyiR-6D~QZpInyd0NPkw3YTUpPD~iEx~oNN2cnSxsMA7axoXqo9~AfvhmN3ylFox2xgEvFPfJZKWPDNxqkeVuHSu9qsGZccsbWMJSr3cnvX1-V8HWJ7Y6bGLB9eGBMsIoDGajjnGvXJpIXc1q5qCyJk3c-xcUc5SBWsZV1pMzMAwtcQRiJdOA-D98bdTaD079yDoj4ajoVi~12hoN-ojcM049n0v3a-mN7dP16SPct6BoQcMx7py2fsvCC9shMaeg__&Key-Pair-Id=K38HBHX5LX3X2H',
  'e3c3146fd8882061f97aadb30cd1c551':'https://files2.heygen.ai/aws_pacific/avatar_tmp/88574ea85d0040b2a2836001c97400ea/e3c3146fd8882061f97aadb30cd1c551.mp4?Expires=1790973998&Signature=CRP5IpzMCa7CaA5iex2YkjswqhCgovWRK-bbp7iirFOzMEaD-vdkIxqpX3gcUkA1JHEZ7A~yFFU6WwPTTCroxldbJ0Rci8y6A05RUEQmIxAqFTsR13YlnWEyvGbrt~6FXFW-~wWSOuey5xuup-kAPo4JBRsIiLSQ7GOdWcHw-jqka06PwMQQtq2jUzaS0E8VuR5E2PacoqlFWeHzwUu8yKorAx03fMBxcmHMwN1kBZcuWtIvLzENW5S17995JFJUyYZ8IKDq1Yj~xNfARn73WHjhu4V~0fet4-Qef0hZiDalGF-YmgHMYyKOeFghGsCVdp9az8ZoCNq-8BrQYcpJeA__&Key-Pair-Id=K38HBHX5LX3X2H',
  'aaa2bdbd267cdf52f10bf4332c20c24d':'https://files2.heygen.ai/aws_pacific/avatar_tmp/88574ea85d0040b2a2836001c97400ea/aaa2bdbd267cdf52f10bf4332c20c24d.mp4?Expires=1790974028&Signature=LPHhjS9o1tlOiKQkJAWnqbR5K9CKVcjshQVj9tqaW1JdP65DGoQO3y47LkqPocWg28i~VJwg13VSWROKpiYFee5FHaqimxL2T9d5IF0ukOK6WvSiKvqWmOTl9O-t~qeW3LWRFWuUkjTNo2s800Syc4ZJDWxbkpHmAJQHot6OfjGBCOXBTudGncVM2C-4IQal7eISp3q81RV4EOjLXvvv7-NhCpt5wZgITrl5ieBnyl4bBi1HMHEjB24NU4kNAPDh2HZuPJ5500~OG0EqTGMRGVidAS1nNJFG2gGDbODZo1uEzKpRlRanfTi9qNWtILWYpA4y5kkTcWUmFIk5ZiYuHg__&Key-Pair-Id=K38HBHX5LX3X2H',
  'ca91cf52b9bfd5ea053d97c8f660cdcb':'https://files2.heygen.ai/aws_pacific/avatar_tmp/88574ea85d0040b2a2836001c97400ea/ca91cf52b9bfd5ea053d97c8f660cdcb.mp4?Expires=1791003877&Signature=G4knTJMRuc3Q1raMbAuFD5m8gGJImBJ9hkukGDNRmloVOtI0Ehd6DII225M9w~dvUx4xy2fRmdk8gybYLCZT8ErpfMPwfNZelwwBzTxK2gzvh3k-xdriQ-ZEuc~7CnlJcnhUSGFa96bXl8~lFTKBQcR4GzWZsxSC7BNB2ZAG1IXF9i-VlhEvtdJf3KPW2y~4U2HbaNZUVfEECgbvlrApFswP~gxs1rX5sfr0hO5i9xoyHJCRsZP79sQUHPDO05slG7qzxd-xglcUgUXm2u1~sPkXmD5eNEfvXhrvhMoULg7UCcjQFA3yU6AqAR3fBI63xpYMLYkZOIE9s0-vQpYPeg__&Key-Pair-Id=K38HBHX5LX3X2H',
  '65a14e3f3970c6406712a99e31827fd6':'https://files2.heygen.ai/aws_pacific/avatar_tmp/88574ea85d0040b2a2836001c97400ea/65a14e3f3970c6406712a99e31827fd6.mp4?Expires=1790974238&Signature=iNxQWMvFMVbpvexA3Nt2pbXglxOCdYo7Sk6PVSYR6XLFkSmaYQswTiGQqKPKsfQ-kfDkDu343uhgnFDlaTYsu2C2K94H0DnChJApf~nNUuVJCuWG0uexFDXcpx73du8QBthEbCeihO6VkYwM9wEnFbm-J9vuAqUQieqaTuoOHEE8jYxAnoyHsjmGTCwxYdC14JY2JgAUI5A0ULsNfQHe9SZ1UF5Hhs1EiYjwRI2mtKuNVfd6fIrzrc6QUHRKTZwxzIpueeopAkGEZ3JpDS-bV3X4sJHR-Y3Sn5egJf9EX9CfiWNStt-H1pFg~RWb2AKL7zvoHdK-u7Ox9wYBDwkUhw__&Key-Pair-Id=K38HBHX5LX3X2H'
};

async function main(){
  const out=path.join(process.cwd(),'public','reels');
  const tmp=path.join('/tmp','brief-reels');
  fs.mkdirSync(out,{recursive:true});fs.mkdirSync(tmp,{recursive:true});
  for(const [id,url] of Object.entries(reels)){
    console.log('Fetching reel',id);
    const res=await fetch(url);
    if(!res.ok)throw new Error('HeyGen fetch failed '+id+' '+res.status);
    const src=path.join(tmp,id+'.mp4');
    fs.writeFileSync(src,Buffer.from(await res.arrayBuffer()));
    const dest=path.join(out,id+'.mp4');
    const p=spawnSync(ffmpeg,['-y','-i',src,'-c:v','libx264','-profile:v','high','-level','4.0','-pix_fmt','yuv420p','-preset','fast','-crf','20','-movflags','+faststart','-c:a','aac','-b:a','160k','-ar','48000',dest],{stdio:'inherit'});
    if(p.status!==0)throw new Error('ffmpeg failed '+id);
    const stat=fs.statSync(dest);
    if(stat.size<100000)throw new Error('normalized reel unexpectedly small '+id);
    console.log('Normalized',id,stat.size);
  }
}
main().catch(e=>{console.error(e);process.exit(1)});
