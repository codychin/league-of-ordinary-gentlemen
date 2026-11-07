import test from 'node:test';
import assert from 'node:assert/strict';
import {isKnownXEmbedAppendChildError as classify} from '../qa/helpers/javascript-error-origin.mjs';
const message="Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'.";
const frame='    at e.value (https://platform.twitter.com/embed/embed.5332.340f0930f4dd862af95f.js:1:106242)';
const stack=`TypeError: ${message}\n${frame}\n    at https://platform.twitter.com/embed/embed.5332.340f0930f4dd862af95f.js:1:108053`;
test('only the traced X iframe appendChild error is classified separately',()=>assert.equal(classify({message,stack}),true));
test('identical first-party or mixed errors remain fatal',()=>{
 for(const stack of [`TypeError: ${message}\n    at app (http://localhost:3000/_next/app.js:1:10)`, `TypeError: ${message}\n${frame}\n    at app (https://www.ordinarybrief.com/_next/app.js:1:10)`, '', `TypeError: ${message}\n    at x (https://platform.twitter.com.evil.test/embed/a.js:1:10)`])assert.equal(classify({message,stack}),false);
});
test('other X errors and unknown failures remain fatal',()=>{
 assert.equal(classify({message:'Unknown failure',stack}),false);
 assert.equal(classify({message,stack:`TypeError: ${message}\n    at https://platform.twitter.com/widgets.js:1:10`}),false);
});
