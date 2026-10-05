export default function BreakingNewsBanner(){
  return (
    <div aria-label="Breaking news" style={{background:'#a32626',color:'#fff',borderBottom:'1px solid #11100e'}}>
      <div style={{maxWidth:1180,margin:'0 auto',padding:'9px 18px',display:'flex',gap:14,alignItems:'center',justifyContent:'space-between',fontSize:11,fontWeight:800,letterSpacing:1.6,textTransform:'uppercase'}}>
        <span style={{whiteSpace:'nowrap'}}>Breaking News</span>
        <a href="https://x.com/ab84/status/2105831116464886238" target="_blank" rel="noopener noreferrer" style={{color:'#fff',textDecoration:'none',flex:1}}>
          Antonio Brown Bombs Hospital in Mike Tomlin’s Minecraft City
        </a>
        <span style={{whiteSpace:'nowrap',opacity:.8}}>Global Update</span>
      </div>
    </div>
  );
}
