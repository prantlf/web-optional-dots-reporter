import type { Reporter } from '@web/test-runner'
import { optionalDotsReporter } from '..'

declare type testCallback = () => void
declare function test (label: string, callback: testCallback): void

test('Type declarations for TypeScript', () => {
  let _reporter: Reporter
  _reporter = optionalDotsReporter()
  _reporter = optionalDotsReporter({ dots: true })
  _reporter = optionalDotsReporter({ fileNames: true })
  _reporter = optionalDotsReporter({ reportResults: false })
})
