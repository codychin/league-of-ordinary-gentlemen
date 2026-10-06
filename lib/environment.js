// Both values are deliberately explicit: production builds do not inherit QA mode.
export const isStaging = process.env.BRIEF_ENV === 'staging' || process.env.NEXT_PUBLIC_BRIEF_ENV === 'staging';
