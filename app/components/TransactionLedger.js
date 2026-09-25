const tx=[
['SEP 25','All Ugly','ADD/DROP','Panthers D/ST / Chargers D/ST • $0'],
['SEP 24','Skatt','ADD/DROP','Bengals D/ST / Buccaneers D/ST • $0'],
['SEP 23','Hopkins','ADD','Trey Smack • $0'],
['SEP 23','Kupp','ADD','Daniel Carlson • $0'],
['SEP 23','All Ugly','ADD/DROP','Jared Goff / Malik Willis • $0'],
['SEP 23','Pollard','ADD/DROP','Lions D/ST / Justice Hill • $0'],
['SEP 23','Lloyd','ADD/DROP','Chase McLaughlin / Cameron Dicker • $0'],
['SEP 23','Hopkins','ADD','Cody White • $0'],
['SEP 23','Danir','FAILED BID','Panthers D/ST / Broncos D/ST • $2'],
['SEP 23','Danir','WAIVER','Vikings D/ST / Broncos D/ST • $2'],
['SEP 23','Danir','FAILED BID','Chase McLaughlin / Harrison Mevis • $2'],
['SEP 23','Danir','WAIVER','Evan McPherson / Harrison Mevis • $2'],
['SEP 23','Pollard','FAILED BID','C.J. Stroud / Daniel Jones • $2'],
['SEP 23','Route 22','FAILED BID','Emanuel Wilson / Kenyon Sadiq • $3'],
['SEP 23','Pollard','WAIVER','Jordan Love / Daniel Jones • $3'],
['SEP 23','Route 22','WAIVER','Dalton Schultz / Kenyon Sadiq • $3'],
['SEP 23','Pollard','FAILED BID','Emanuel Wilson / Justice Hill • $5'],
['SEP 23','Hopkins','WAIVER','Rashod Bateman • $3'],
['SEP 23','Kraft','WAIVER','Adonai Mitchell / Antonio Williams • $5'],
['SEP 23','Lloyd','WAIVER','Emanuel Wilson / David Njoku • $19'],
['SEP 23','Lloyd','FAILED BID','Rashod Bateman / David Njoku • $16'],
['SEP 23','Lloyd','FAILED BID','Adonai Mitchell / David Njoku • $12']
]

function Rows({rows}){return <div className="transactionRows">{rows.map((t,i)=><div className="txRow" key={`${t[0]}-${t[1]}-${i}`}><small>{t[0]}</small><b>{t[1]}</b><span>{t[3]}</span><em>{t[2]}</em></div>)}</div>}
export default function TransactionLedger(){return <div className="transactionLedger"><h3>The Full Wire</h3><Rows rows={tx.slice(0,8)}/><details className="moreTransactions"><summary>LOAD MORE TRANSACTIONS</summary><Rows rows={tx.slice(8)}/></details><div className="ledgerNote">22 WEEK 3 ACTIONS • ESPN TRANSACTION RECORD • UPDATED SEP 25</div></div>}
