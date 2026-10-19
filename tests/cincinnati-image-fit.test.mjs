import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const page = readFileSync(new URL('../app/articles/[slug]/page.js', import.meta.url), 'utf8')
test('Cincinnati hero preserves its full natural aspect ratio without changing other article headers', () => {
  assert.match(page, /style=\{slug==='hollis-west-virginia-medical-assistance'\?\{height:'auto',maxHeight:'none',objectFit:'contain'\}:undefined\}/)
  assert.match(page, /className=\{`articleImage /)
  assert.match(page, /src=\{a\.image\} alt=\{a\.imageAlt\|\|''\}/)
})
