import {checkApprovedVideoPackageFiles} from '../lib/reel-publication-gate.mjs';
const result=checkApprovedVideoPackageFiles();
if (!result.ok){console.error(result.errors.join('\n'));process.exitCode=1;}
else console.log('Video approval gate passed for '+result.checked+' previously approved assets.');
