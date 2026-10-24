export default {
  async headers(){return [{source:'/publishing-pilot/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]},{source:'/images/cache/:file',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]}
}
