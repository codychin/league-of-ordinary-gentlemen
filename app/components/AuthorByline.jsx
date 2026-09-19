import Link from 'next/link'
import Image from 'next/image'
import {writerFor} from '../articles/writers'

export default function AuthorByline({slug,date}){const writer=writerFor(slug);return <div className="byline"><Link className="bylineWriter" href={`/staff#${writer.slug}`}><Image src={writer.image} alt="" width={42} height={42}/><span><small>BY</small><strong>{writer.name.toUpperCase()}</strong></span></Link><em>{writer.title.toUpperCase()}</em><time>{date}</time></div>}
