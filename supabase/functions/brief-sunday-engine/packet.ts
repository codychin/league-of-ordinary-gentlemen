export type EditorialPacket={league:any[];nfl:any[];memory:any[];recent:any[];lore:string[]}
export function buildPacket(args:EditorialPacket){
 return {
  mission:'Pitch distinct stories. Do not narrate data collection or refresh mechanics. Treat silence as valid.',
  editorialRules:[
   'Generate 6-8 premises before choosing any story.',
   'Each premise must state what is interesting and why it matters.',
   'Different source URLs do not make premises different.',
   'Use league-specific consequence when it materially improves the story.',
   'Choose a desk only after the premise exists.',
   'Maude requires quantitative football evidence.',
   'Never reuse a prior thesis or canned closing language.'
  ],
  ...args
 }
}
