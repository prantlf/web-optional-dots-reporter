import { relative } from 'path'
import { TestRunnerLogger } from '../../@web/test-runner/dist/logger/TestRunnerLogger.js'
import { reportBrowserLogs } from '../../@web/test-runner/dist/reporter/reportBrowserLogs.js'
import { reportRequest404s } from '../../@web/test-runner/dist/reporter/reportRequest404s.js'
import { reportTestFileErrors } from '../../@web/test-runner/dist/reporter/reportTestFileErrors.js'
import { reportTestsErrors } from '../../@web/test-runner/dist/reporter/reportTestsErrors.js'

const { isTTY } = process.stdout

export function optionalDotsReporter(options = {}) {
  const { dots = isTTY, fileNames = false, reportResults = true } = options
  const logger = new TestRunnerLogger()
  const cwd = process.cwd()

  const reset = '\x1b[0m\x1b[0m'
  const color = ([before, after]) => text => `\x1b[${before}m${text}\x1b[${after}m${reset}`
  const green = color([32, 89])
  const red = color([31, 89])

  let browsers, chromeBrowser, browserLogs, coverage, coverageConfig

  function logTest(totals, { duration, name, passed, skipped }, testFile, { name: browserName } = {}) {
    const ok = passed || skipped
    if (dots) {
      process.stdout.write(ok ? '.' : red('x'))
    } else {
      const sign = ok ? green('✓') : red('𐄂')
      if (fileNames && testFile) {
        const filePath = relative(cwd, testFile)
        logger.log(`${sign} ${name} (${filePath} in ${browserName})`)
      } else if (testFile) {
        logger.log(`${sign} ${name} (in ${browserName})`)
      } else {
        logger.log(`${sign} ${name}`)
      }
    }

    totals.tests += 1
    if (passed) {
      totals.passed += 1
    } else if (!ok) {
      totals.failed += 1
    }
    if (duration) {
      totals.duration += duration
    }
  }

  function logSuite(totals, { name, tests, suites }, testFile, { name: browserName } = {}) {
    if (!dots) {
      if (fileNames && testFile) {
        const filePath = relative(cwd, testFile)
        logger.log(`${name} (${filePath} in ${browserName})`)
      } else if (testFile) {
        logger.log(`${name} (in ${browserName})`)
      } else {
        logger.log(name)
      }
      logger.group()
    }

    for (const test of tests) logTest(totals, test)
    if (!dots) logger.log()
    for (const suite of suites) logSuite(totals, suite)
    if (!dots) logger.groupEnd()

    totals.suites += 1
  }

  const browserTotals = {}

  function ensureSessionTotals({ name }) {
    let sessionTotals = browserTotals[name]
    if (!sessionTotals) {
      sessionTotals = {
        files: 0, suites: 0, tests: 0, passed: 0, failed: 0, duration: 0
      }
      browserTotals[name] = sessionTotals
    }
    return sessionTotals
  }

  function logSession({ browser, testFile, testResults }) {
    const totals = ensureSessionTotals(browser)

    for (const test of testResults.tests) {
      logTest(totals, test, testFile, browser)
    }
    for (const suite of testResults.suites) {
      logSuite(totals, suite, testFile, browser)
    }

    totals.files += 1
  }

  function reportCoverage({ summary }) {
    for (const [type, expected] of Object.entries(coverageConfig.threshold)) {
      const { pct: actual } = summary[type]
      const result = actual < expected ? red('does not meet') : green('meets')
      logger.log(`Coverage for ${type} (${actual}'%) ${result} global threshold (${expected}%)`)
    }
    logger.log()
  }

  function isChrome(browserName) {
    const name = browserName.toLowerCase()
    return name.includes('chrome') || name.includes('chromium') || name.includes('firefox')
  }

  return {
    start({ config, browserNames }) {
      ({ browserLogs, coverage, coverageConfig } = config)
      browsers = browserNames
      chromeBrowser = browserNames.find(isChrome) ?? browserNames[0]
    },

    reportTestFileResults({ sessionsForTestFile }) {
      if (!reportResults) return

      for (const session of sessionsForTestFile) {
        logSession(session)
      }
    },

    onTestRunFinished({ sessions, testCoverage }) {
      if (dots) {
        logger.log()
        logger.log()
      }

      if (browserLogs) {
        reportBrowserLogs(logger, sessions)
        reportRequest404s(logger, sessions)
      }
      reportTestFileErrors(logger, browsers, chromeBrowser, sessions, true)

      const failedSessions = sessions.filter(session => !session.passed)
      if (failedSessions.length > 0) {
        reportTestsErrors(logger, browsers, chromeBrowser, failedSessions)
      }
      if (coverage) {
        reportCoverage(testCoverage)
      }

      for (const [name, totals] of Object.entries(browserTotals)) {
        const { files, suites, tests, passed, failed, duration } = totals
        const skipped = tests - passed - failed
        const seconds = (duration / 1000).toFixed(1)
        let passedText = `${passed} passed`
        if (passed) passedText = green(passedText)
        let failedText = `${failed} failed`
        if (failed) failedText = red(failedText)
        logger.log(`${name}: ${files} files, ${suites} suites, ${tests} tests, `
          + `${passedText}, ${failedText}, ${skipped} skipped in ${seconds}s`)
      }
    }
  }
}
