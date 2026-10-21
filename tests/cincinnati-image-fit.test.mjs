import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const page = readFileSync(new URL('../app/articles/[slug]/page.js', import.meta.url), 'utf8')
test('Cincinnati and approved interview heroes preserve natural aspect ratios without changing other headers', () => {
  assert.match(page, /style=\{\['hollis-west-virginia-medical-assistance','marnie-delicate-etiquette-sporting-pat'\]\.includes\(slug\)\?\{height:'auto',maxHeight:'none',objectFit:'contain'\}:undefined\}/)
  assert.match(page, /className=\{`articleImage /)
  assert.match(page, /src=\{a\.image\} alt=\{a\.imageAlt\|\|''\}/)
})
