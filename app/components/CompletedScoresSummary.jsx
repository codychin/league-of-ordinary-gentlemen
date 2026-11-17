import summaries from '../../data/week10-scores-summaries.json';
export default function CompletedScoresSummary({edition,week,isFinal}) {
 const summary=summaries[edition];
 if(!isFinal||!summary||Number(week)!==summary.week)return null;
 return <div className="completedScoresSummary"><h3>{summary.headline}</h3>{(Array.isArray(summary.body)?summary.body:[summary.body]).map((p,i)=><p key={i}>{p}</p>)}</div>;
}
