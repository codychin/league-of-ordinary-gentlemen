import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const page = readFileSync(new URL('../app/articles/[slug]/page.js', import.meta.url), 'utf8')
test('All ordinary article heroes preserve natural aspect ratios and authored positioning', () => {
  assert.match(page, /style=\{\{height:'auto',maxHeight:'none',objectFit:'contain',\.\.\.\(a\.imageObjectPosition\?\{objectPosition:a\.imageObjectPosition\}:\{\}\)\}\}/)
  assert.match(page, /className=\{`articleImage /)
  assert.match(page, /src=\{a\.image\} alt=\{a\.imageAlt\|\|''\}/)
})
