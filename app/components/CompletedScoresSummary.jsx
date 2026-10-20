import summaries from '../../data/week6-scores-summaries.json';
export default function CompletedScoresSummary({edition,week,isFinal}) {
 const summary=summaries[edition];
 if(!isFinal||!summary||Number(week)!==summary.week)return null;
 return <div className="completedScoresSummary"><h3>{summary.headline}</h3><p>{summary.body}</p></div>;
}
