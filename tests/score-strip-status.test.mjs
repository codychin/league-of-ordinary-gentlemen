import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreStripPhase} from '../lib/score-strip-status.mjs';
test('weekly points override the Sunday kickoff clock without claiming freshness',()=>{
  for(const score of [12.3,-2])assert.equal(scoreStripPhase({matchups:[{home:{score},away:{score:0}}]},'PREGAME'),'WEEK IN PROGRESS');
  assert.equal(scoreStripPhase({matchups:[{home:{score:0},away:{score:0}}]},'PREGAME'),'PREGAME');
  assert.equal(scoreStripPhase({matchups:[{home:{score:0},away:{score:0}}]},'LIVE'),'AWAITING POINTS');
});
test('only actual final evidence yields final',()=>{
  assert.equal(scoreStripPhase({matchups:[{winner:'HOME',home:{score:40}}]},'PREGAME'),'FINAL');
  assert.notEqual(scoreStripPhase({matchups:[{home:{score:40}}]},'FINAL'),'FINAL');
});
