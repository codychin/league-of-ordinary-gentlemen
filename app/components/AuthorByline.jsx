import Link from 'next/link'
import Image from 'next/image'
import {writerFor} from '../articles/writers'

export default function AuthorByline({slug,date}){const writer=writerFor(slug);return <div className="byline"><Link className="bylineWriter" href={`/staff#${writer.slug}`}><Image src={writer.image} alt="" width={42} height={42}/><span><strong>By {writer.name}</strong><em>{writer.title}</em></span></Link><time>{date}</time></div>}
