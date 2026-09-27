import {similarity,rank} from './editorial.ts'
import {publishable} from './quality.ts'
function ok(x:boolean,msg:string){if(!x)throw new Error(msg)}
const hollisA={writer:'crane',tag:'FIELD NOTES',subject:'The injury report has created a human problem, not just a lineup problem',text:'Justin Jefferson left with an ankle injury. The useful question is not to cosplay as a doctor. It is what this uncertainty changes for everyone waiting on him.',thread:'NFL WIRE',story_key:'a'}
const hollisB={...hollisA,story_key:'b',text:'Marcus Mariota replaced an injured starter. The useful question is not to cosplay as a doctor. It is what this uncertainty changes for everyone waiting on him.'}
ok(similarity(hollisA.subject+' '+hollisA.text,hollisB.subject+' '+hollisB.text)>.66,'duplicate premise not detected')
ok(rank([hollisB],[hollisA]).length===0,'duplicate premise survived ranking')
ok(!publishable(hollisA),'reusable Hollis template survived quality gate')
ok(!publishable({writer:'gannon',subject:'Live score',text:'A player did something interesting and there may be a role change worth watching but there is no quantitative evidence here at all.',tag:'FOOTBALL',thread:'NFL WIRE',story_key:'x'}),'Maude without evidence survived')
ok(publishable({writer:'gannon',subject:'Target tree moved',text:'A receiver has 11 targets for 8 catches and 112 yards. Eleven targets is the actionable signal because the offense is repeatedly choosing him in high-leverage situations.',tag:'ANALYTICS',thread:'NERD BALL',story_key:'y'}),'evidence-backed Maude rejected')
console.log('editorial tests passed')
