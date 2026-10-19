// Nonsecret private-test configuration. Disabled until account/pricing checks pass.
// Changing this flag requires reviewed deployment; expiry never extends itself.
export const TEST_ENABLED = false;
export const COST_POLICY = 
{
  "totalTestCapUSD": 20,
  "verifiedAt": "2026-10-19T17:18:00Z",
  "quotes": {
    "reason": {
      "expiresAt": "2026-10-20T17:18:00Z",
      "sourceURL": "https://developers.openai.com/api/docs/models/gpt-4.1-mini",
      "model": "gpt-4.1-mini",
      "maximumMicroUSD": 1000000,
      "maxInputBytes": 180000,
      "maxOutputTokens": 200
    },
    "stt": {
      "expiresAt": "2026-10-20T17:18:00Z",
      "sourceURL": "https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe",
      "model": "gpt-4o-mini-transcribe",
      "maximumMicroUSD": 100000,
      "maxAudioBytes": 960044,
      "maxSeconds": 30
    },
    "tts": {
      "expiresAt": "2026-10-20T17:18:00Z",
      "sourceURL": "https://developers.openai.com/api/docs/models/tts-1-hd",
      "model": "tts-1-hd",
      "maximumMicroUSD": 200000,
      "maxInputBytes": 8000
    }
  }
}
;
