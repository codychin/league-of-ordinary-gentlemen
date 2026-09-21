export const runtime='edge'

export async function GET(){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#f3efe5"/>
  <rect x="0" y="0" width="1600" height="34" fill="#11100e"/>
  <text x="80" y="105" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900" letter-spacing="4" fill="#a52a22">THE BRIEF • MONDAY NIGHT SURVIVAL BOARD</text>
  <text x="80" y="178" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#11100e">Four Paths Through Monday Night</text>
  <text x="80" y="230" font-family="Georgia, serif" font-size="32" font-style="italic" fill="#6e6a61">Some considerably less legal than others.</text>
  <line x1="80" x2="1520" y1="270" y2="270" stroke="#11100e" stroke-width="4"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#11100e">
    <g transform="translate(80 330)">
      <text font-size="20" font-weight="900" fill="#a52a22">I'M A SKATT MAN</text>
      <text y="66" font-size="72" font-weight="900">37.46</text>
      <text y="104" font-size="18" font-weight="700" letter-spacing="2">NEEDED</text>
      <text y="148" font-size="24" font-family="Georgia, serif">Kyren Williams + Cam Skattebo</text>
    </g>
    <g transform="translate(810 330)">
      <text font-size="20" font-weight="900" fill="#a52a22">ROUTE 22</text>
      <text y="66" font-size="72" font-weight="900">30.94</text>
      <text y="104" font-size="18" font-weight="700" letter-spacing="2">NEEDED</text>
      <text y="148" font-size="24" font-family="Georgia, serif">Matthew Stafford</text>
    </g>
    <g transform="translate(80 580)">
      <text font-size="20" font-weight="900" fill="#a52a22">DARKHORSE DANIR</text>
      <text y="66" font-size="72" font-weight="900">39.44</text>
      <text y="104" font-size="18" font-weight="700" letter-spacing="2">NEEDED</text>
      <text y="148" font-size="24" font-family="Georgia, serif">Malik Nabers</text>
    </g>
    <g transform="translate(810 580)">
      <text font-size="20" font-weight="900" fill="#a52a22">MR HOPKINS OPUS</text>
      <text y="66" font-size="72" font-weight="900">+69.90</text>
      <text y="104" font-size="18" font-weight="700" letter-spacing="2">CURRENT MARGIN</text>
      <text y="148" font-size="24" font-family="Georgia, serif">Jaxson Dart still to play</text>
    </g>
  </g>
  <line x1="790" x2="790" y1="300" y2="810" stroke="#b8b0a1" stroke-width="2"/>
  <line x1="80" x2="1520" y1="540" y2="540" stroke="#b8b0a1" stroke-width="2"/>
  <text x="80" y="855" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" letter-spacing="3" fill="#6e6a61">SEPTEMBER 21, 2026 • WEEK 2 • MONDAY NIGHT PENDING</text>
  </svg>`
  return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=86400, s-maxage=604800'}})
}
