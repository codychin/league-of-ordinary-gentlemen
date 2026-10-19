import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import {voiceHandler} from './handler.mjs'
import {TEST_ENABLED,COST_POLICY} from './test-config.mjs'
Deno.serve(voiceHandler({createClient,env:(name:string)=>name==='NEWSROOM_VOICE_ENABLED'?String(TEST_ENABLED):name==='NEWSROOM_COST_POLICY'?JSON.stringify(COST_POLICY):Deno.env.get(name)}))
