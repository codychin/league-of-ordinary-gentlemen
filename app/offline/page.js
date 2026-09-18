import Link from 'next/link'

export const metadata={title:'Edition Unavailable | The Brief'}

export default function Offline(){
  return <main className="offlinePage">
    <div className="eyebrow">THE BRIEF • TEMPORARILY OFF THE WIRE</div>
    <h1>This edition cannot be reached.</h1>
    <p>The newsroom has either lost its connection or been advised by counsel to stop refreshing. Previously opened coverage may remain available.</p>
    <Link href="/">TRY THE FRONT PAGE AGAIN →</Link>
  </main>
}

