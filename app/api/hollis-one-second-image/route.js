export const runtime='edge'

export async function GET(){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#071019"/><stop offset="1" stop-color="#1d2226"/></linearGradient>
    <linearGradient id="field" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#203527"/><stop offset="1" stop-color="#0d1711"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#f6d58a" stop-opacity=".9"/><stop offset="1" stop-color="#f6d58a" stop-opacity="0"/></radialGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000" flood-opacity=".65"/></filter>
    <filter id="blur"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>
  <rect width="1600" height="900" fill="url(#sky)"/>
  <circle cx="800" cy="255" r="360" fill="url(#glow)" opacity=".16"/>
  <g opacity=".55" fill="#11171c">
    <path d="M0 285L180 210 365 282 520 205 710 275 910 200 1110 270 1325 215 1600 300V575H0Z"/>
  </g>
  <g fill="#f3e4b2" opacity=".88">
    <circle cx="115" cy="345" r="5"/><circle cx="160" cy="330" r="4"/><circle cx="225" cy="350" r="5"/><circle cx="1390" cy="336" r="5"/><circle cx="1450" cy="352" r="4"/><circle cx="1510" cy="330" r="5"/>
  </g>
  <rect y="565" width="1600" height="335" fill="url(#field)"/>
  <path d="M0 690H1600M0 765H1600" stroke="#e7e2d4" stroke-width="5" opacity=".5"/>
  <path d="M800 565V900" stroke="#e7e2d4" stroke-width="4" opacity=".25"/>
  <g filter="url(#shadow)">
    <rect x="366" y="84" width="868" height="374" rx="10" fill="#0b0e11" stroke="#505760" stroke-width="7"/>
    <rect x="398" y="116" width="804" height="310" fill="#12181d"/>
    <text x="445" y="185" fill="#c5cbd1" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="700" letter-spacing="3">REPLAY REVIEW</text>
    <rect x="920" y="137" width="225" height="92" rx="8" fill="#050607" stroke="#d58b2d" stroke-width="3"/>
    <text x="1032" y="203" text-anchor="middle" fill="#ffae3d" font-family="monospace" font-size="72" font-weight="900">0:01</text>
    <g transform="translate(575 245)">
      <ellipse cx="0" cy="94" rx="112" ry="42" fill="#090b0d" opacity=".8"/>
      <circle cx="-68" cy="18" r="48" fill="#681f24"/><path d="M-110 15Q-68-28-23 17" fill="none" stroke="#d8dbe0" stroke-width="8"/>
      <path d="M-86 60Q-10 70 68 124" stroke="#7b252c" stroke-width="46" stroke-linecap="round"/>
      <circle cx="152" cy="20" r="48" fill="#a17e3b"/><path d="M108 13Q150-27 195 18" fill="none" stroke="#111" stroke-width="8"/>
      <path d="M140 67Q150 138 95 162" stroke="#1a1d20" stroke-width="48" stroke-linecap="round"/>
      <ellipse cx="112" cy="110" rx="28" ry="18" transform="rotate(-20 112 110)" fill="#7b4a25" stroke="#d9c6a3" stroke-width="3"/>
    </g>
  </g>
  <g filter="url(#shadow)">
    <rect x="1115" y="500" width="365" height="138" rx="10" fill="#0b0e11" stroke="#343a40" stroke-width="3"/>
    <text x="1148" y="548" fill="#8f989f" font-family="Arial,sans-serif" font-size="29" font-weight="800">34 – 31</text>
    <text x="1273" y="548" fill="#818990" font-family="Arial,sans-serif" font-size="34">→</text>
    <text x="1352" y="548" fill="#ffb448" font-family="Arial,sans-serif" font-size="31" font-weight="900">35 – 31</text>
    <text x="1148" y="602" fill="#d8ddd9" font-family="Arial,sans-serif" font-size="17" letter-spacing="2">SAME GAME. DIFFERENT SCOREBOARD.</text>
  </g>
  <g opacity=".82" font-family="Arial,sans-serif">
    <g transform="translate(80 118) rotate(-5)">
      <rect width="275" height="210" rx="10" fill="#141b21" stroke="#4d555c"/>
      <text x="24" y="42" fill="#c8d0d5" font-size="19" font-weight="800">SPREAD</text>
      <text x="196" y="42" fill="#c8d0d5" font-size="19">NCST +3.5</text>
      <path d="M22 61H252" stroke="#5a6268"/>
      <text x="24" y="100" fill="#929da5" font-size="18">TICKETS</text><text x="190" y="100" fill="#f2f3f4" font-size="28" font-weight="900">71%</text>
      <text x="24" y="146" fill="#929da5" font-size="18">RESULT</text><text x="171" y="146" fill="#d85c57" font-size="23" font-weight="900">LOST</text>
      <text x="24" y="187" fill="#747d84" font-size="15">ONE SECOND LATER</text>
    </g>
    <g transform="translate(1278 102) rotate(5)">
      <rect width="258" height="220" rx="10" fill="#141b21" stroke="#4d555c"/>
      <text x="22" y="42" fill="#c8d0d5" font-size="19" font-weight="800">SPREAD</text>
      <text x="169" y="42" fill="#c8d0d5" font-size="19">VAN -3.5</text>
      <path d="M20 61H238" stroke="#5a6268"/>
      <text x="22" y="101" fill="#929da5" font-size="18">MONEY</text><text x="169" y="101" fill="#f2f3f4" font-size="28" font-weight="900">66%</text>
      <text x="22" y="147" fill="#929da5" font-size="18">RESULT</text><text x="166" y="147" fill="#6cbe78" font-size="23" font-weight="900">WON</text>
      <text x="22" y="190" fill="#747d84" font-size="15">ONE SECOND LATER</text>
    </g>
  </g>
  <g fill="#eee8dc" opacity=".82" font-family="monospace">
    <g transform="translate(155 610) rotate(-12)"><rect width="210" height="108" fill="#d9d4c8"/><text x="18" y="34" fill="#272a2d" font-size="18">BET PLACED</text><text x="18" y="63" fill="#272a2d" font-size="15">NC STATE +3.5</text><text x="18" y="88" fill="#8a2b2b" font-size="16">STATUS: LOST</text></g>
    <g transform="translate(1255 710) rotate(9)"><rect width="225" height="112" fill="#d9d4c8"/><text x="18" y="34" fill="#272a2d" font-size="18">CASH OUT?</text><text x="18" y="64" fill="#272a2d" font-size="15">VANDERBILT -3.5</text><text x="18" y="90" fill="#2d6b3c" font-size="16">STATUS: WON</text></g>
  </g>
  <g transform="translate(560 640)">
    <ellipse cx="240" cy="160" rx="330" ry="42" fill="#020304" opacity=".38" filter="url(#blur)"/>
    <path d="M183 62Q240 8 302 62L335 160Q240 194 145 160Z" fill="#171b1d"/>
    <path d="M177 65Q240 18 306 64" fill="none" stroke="#b18b43" stroke-width="20"/>
    <ellipse cx="230" cy="127" rx="50" ry="30" transform="rotate(-20 230 127)" fill="#7b4a25" stroke="#d3b98c" stroke-width="4"/>
  </g>
  <text x="80" y="847" fill="#d8d3c7" font-family="Georgia,serif" font-size="44" font-style="italic">One second. No new winner. A new financial reality.</text>
  </svg>`
  return new Response(svg,{headers:{'content-type':'image/svg+xml; charset=utf-8','cache-control':'public, max-age=3600, s-maxage=86400'}})
}
