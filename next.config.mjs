export default {
  async headers(){return [{source:'/images/cache/:file',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]}
}
