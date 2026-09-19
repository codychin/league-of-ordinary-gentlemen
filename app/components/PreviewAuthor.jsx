import Image from 'next/image'
import {writerFor} from '../articles/writers'

export default function PreviewAuthor({slug}){
  const writer=writerFor(slug)

  return <span className="previewAuthor">
    <Image src={writer.image} alt="" width={28} height={28}/>
    <strong>{writer.name}</strong>
  </span>
}
