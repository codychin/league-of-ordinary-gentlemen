export default {
  outputFileTracingIncludes:{
    '/':['./data/week8-approved-homepage-media.json'],
    '/doge':['./data/week8-approved-homepage-media.json'],
    '/sunday-crew':['./data/week8-approved-homepage-media.json']
  },
  async headers(){return [{source:'/images/cache/:file',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]}
}
