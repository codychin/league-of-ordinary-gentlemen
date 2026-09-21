import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const runtime='nodejs'
export const dynamic='force-static'

export async function GET(){
  const source=await fs.readFile(path.join(process.cwd(),'public','images','staff','sabine-march.webp'))
  const jpeg=await sharp(source).resize({width:1200,withoutEnlargement:true}).jpeg({quality:90,mozjpeg:true}).toBuffer()
  return new Response(jpeg,{headers:{
    'content-type':'image/jpeg',
    'content-length':String(jpeg.length),
    'cache-control':'public, max-age=31536000, immutable',
    'content-disposition':'inline; filename="sabine-march.jpg"',
  }})
}
