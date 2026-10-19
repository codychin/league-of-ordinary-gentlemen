# Proposed bounded initial test, checked 2026-10-19

NOT ACTIVATED. This covers voice-prototype API usage only, not unrelated usage on the same existing key. No prior voice-provider calls have occurred in this task. Never reset the durable ledger on redeploy or treat $20 as a fresh daily allowance.

## Upper bounds and sources

Reasoning: gpt-4.1-mini, standard tier explicitly requested, no tools/images. [Official model page](https://developers.openai.com/api/docs/models/gpt-4.1-mini) lists context1,047,576 tokens, maxoutput32,768, input$0.40/million and output$1.60/million. Even charging the ENTIRE context as input plus the ENTIRE model output maximum gives $0.4714592. Actual request is capped180,000 input bytes and200 output tokens. Reserve $1 for every attempt, including failures/cancellation.

STT: gpt-4o-mini-transcribe. [Official model page](https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe) lists16,000 context,2,000 maxoutput, input$1.25/million and output$5/million. Full context+maxoutput costs $0.03. Actual canonical WAV is≤30seconds, mono16k PCM16 and≤960,044bytes. Reserve $0.10 for every attempt.

Speech: tts-1-hd. [Official model page](https://developers.openai.com/api/docs/models/tts-1-hd) prices input characters at$30/million. Code limits text to2,000 JS UTF-16 codeunits, including normalized spoken substitutions which do not expand current inputs. Thus ≤2,000 Unicode characters and ≤$0.06 per fully generated request. Reserve $0.20 per attempt. The [Speech API](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create) permits PCM streaming and supports this model. Billing is bounded by submitted characters, not received bytes or prompt cancellation.

No retries are automatic. Every new request requires a new atomic reserve+single-use start. Failed, uncertain and cancelled requests retain their full reserve; no invoice refund assumption. Total reserves may never exceed$20. Full-context calculations deliberately exceed application maxima and do not rely on token/byte estimates. The proposed policy expires24hours after verification and must be reverified rather than silently extended. No policy is deployed/configured.

## Scope and remaining verification
These bounds use posted standard API usage rates. No separate minimum perrequest is documented on the inspected pricing/model pages; no assertion is made about undisclosed account-specific fees or taxes. The large reserve margin is conservative but is not proof of arbitrary surcharges. Confirm no different contractual pricing applies before activation. Ordinary infrastructure hosting charges are not accounted as speech/model calls.

The [TTS guide](https://developers.openai.com/api/docs/guides/text-to-speech) lists our provisional stock voices coral, sage, ash, shimmer for tts-1/hd. These are NOT approved canonical cast voices or HeyGen clones. The API explicitly does not support expressive instructions for tts-1/hd. This is a bounded technical audio test, not final personality/voice approval. tts-1-hd is listed deprecated: account availability must be tested, without fallback/retry spending if unavailable.

Unbounded-output gpt-4o-mini-tts remains excluded. Its generated-audio-token pricing lacks a request output cap in the inspected Speech API; a local PCM cutoff alone does not prove maximum provider cost.
