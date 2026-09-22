const standings=[
['Mr Hopkins Opus',2,0,315.00,227.84],
['Lloyd of the Rings',2,0,309.86,267.84],
['Kupp Kupp Doubs',2,0,243.64,226.70],
['CeeDeep Shaheeded Rivalry',1,1,291.03,274.53],
['Pollard Greens',1,1,289.69,306.51],
['The Route 22 Clubhouse',1,1,286.83,269.30],
['Royrek Tishmeshulam',1,1,267.61,286.26],
["Shake 'N Baker",1,1,245.03,287.09],
['For the Love of the Kraft',1,1,243.64,206.02],
['The All Ugly Team',0,2,281.08,304.47],
["I'm a Skatt man",0,2,271.43,293.23],
['DarkHorse Danir',0,2,247.77,342.82]
]
export default function Standings(){return <section className="section standingsWrap" id="standings"><div className="sectionhead"><div><small className="deskLabel">THE TABLE</small><h2>Standings</h2></div><span>THROUGH WEEK 2</span></div><table className="standingsTable"><thead><tr><th>#</th><th>FRANCHISE</th><th>W-L</th><th>PF</th><th>PA</th></tr></thead><tbody>{standings.map((t,i)=><tr key={t[0]}><td>{i+1}</td><td>{t[0]}</td><td>{t[1]}-{t[2]}</td><td>{t[3].toFixed(2)}</td><td>{t[4].toFixed(2)}</td></tr>)}</tbody></table></section>}
