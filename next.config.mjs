const staging = process.env.BRIEF_ENV === 'staging' || process.env.NEXT_PUBLIC_BRIEF_ENV === 'staging' || process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_GIT_COMMIT_REF === 'staging';
export default {
  env: {BRIEF_ENV: staging ? 'staging' : 'production', NEXT_PUBLIC_BRIEF_ENV: staging ? 'staging' : 'production'},
};
