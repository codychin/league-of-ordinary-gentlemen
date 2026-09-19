import Link from 'next/link'
import {writerFor} from '../articles/writers'

export default function AuthorByline({slug,date}){const writer=writerFor(slug);return <div className="byline">BY <Link href={`/staff#${writer.slug}`}>{writer.name.toUpperCase()}</Link><em>{writer.title.toUpperCase()}</em><span>{date}</span></div>}
