import type { Reporter } from '@web/test-runner-core'

/**
 * Options of the function `optionalDotsReporter`.
 */
export interface OptionalDotsReporterOptions {
  /**
   * If dots should be printed instead ot names of test suites and tests.
   * @default `process.stdout.isTTY`
   */
  dots?: boolean,

  /**
   * If the test file names should be printed alongside the test suite names.
   * @default `false`
   */
  fileNames?: boolean,

  /**
   * If each test result should be printed before the test summary.
   * @default `true`
   */
  reportResults?: boolean,
}

/**
 * Creates a new test reporter for `@web/test-runner`.
 */
export function optionalDotsReporter(options?: OptionalDotsReporterOptions): Reporter
