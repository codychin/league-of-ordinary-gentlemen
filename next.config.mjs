export default {
  outputFileTracingIncludes:Object.fromEntries(['/', '/doge', '/sunday-crew', '/archive/watch', '/doge/archive/watch', '/sunday-crew/archive/watch'].map(route=>[route,[
    './data/week8-approved-homepage-media.json','./data/week8-recap-approved-homepage-media.json','./qa/week8-recap-owner-playback-waiver.json'
  ]])),
  async headers(){return [{source:'/images/cache/:file',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]}
}
