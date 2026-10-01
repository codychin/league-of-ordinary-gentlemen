import crypto from 'node:crypto';

function key(){
  const secret=process.env.BRIEF_TOKEN_ENCRYPTION_KEY;
  if(!secret) throw new Error('BRIEF_TOKEN_ENCRYPTION_KEY is not configured');
  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptSecret(value){
  if(!value) return null;
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  const tag=cipher.getAuthTag();
  return [iv,tag,encrypted].map(v=>v.toString('base64url')).join('.');
}
