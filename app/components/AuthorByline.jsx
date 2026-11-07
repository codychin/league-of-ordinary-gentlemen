import Link from 'next/link'
import Image from 'next/image'
import {writerFor} from '../articles/writers'

export default function AuthorByline({slug,root=""}){const writer=writerFor(slug);return <div className="byline"><Link className="bylineWriter" href={`${root?root+"/newsroom":"/staff"}#${writer.slug}`}><Image src={writer.image} alt="" width={96} height={96}/><span><strong>By {writer.name}</strong><em>{writer.title}</em></span></Link></div>}
