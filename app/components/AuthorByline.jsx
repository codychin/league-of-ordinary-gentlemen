import Link from 'next/link'
import Image from 'next/image'
import {writerFor} from '../articles/writers'

export default function AuthorByline({slug,date,root="",disableLink=false}){const writer=writerFor(slug);const Wrapper=disableLink?"span":Link;return <div className="byline"><Wrapper className="bylineWriter" {...(disableLink?{}:{href:`${root?root+"/newsroom":"/staff"}#${writer.slug}`})}><Image src={writer.image} alt="" width={42} height={42}/><span><strong>By {writer.name}</strong><em>{writer.title}</em></span></Wrapper><time>{date}</time></div>}
