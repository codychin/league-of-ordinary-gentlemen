export default {
  outputFileTracingIncludes: {'/api/private-newsroom/*':['./lib/voice-newsroom/canon/*.md','./lib/voice-newsroom/ui/*'],'/manage/newsroom':['./lib/voice-newsroom/ui/*']},
  async headers(){return [{source:'/images/cache/:file',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]}
}
