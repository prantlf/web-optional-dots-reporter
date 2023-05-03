import { relative } from 'path'
import picocolors from 'picocolors'
import { TestRunnerLogger } from '../../@web/test-runner/dist/logger/TestRunnerLogger.js'
import { reportBrowserLogs } from '../../@web/test-runner/dist/reporter/reportBrowserLogs.js'
import { reportRequest404s } from '../../@web/test-runner/dist/reporter/reportRequest404s.js'
import { reportTestFileErrors } from '../../@web/test-runner/dist/reporter/reportTestFileErrors.js'
import { reportTestsErrors } from '../../@web/test-runner/dist/reporter/reportTestsErrors.js'

const { bold, green, red } = picocolors
const { isTTY } = process.stdout

export function optionalDotsReporter(options = {}) {
  const { dots = isTTY, fileNames = false, reportResults = true } = options
  const logger = new TestRunnerLogger()
  const cwd = process.cwd()

  let browsers, chromeBrowser, browserLogs, coverage, coverageConfig

  function logTest(totals, { duration, name, passed, skipped }, testFile, { name: browserName } = {}) {
    const ok = passed || skipped
    if (dots) {
      process.stdout.write(ok ? '.' : red('x'))
    } else {
      const sign = ok ? green('✓') : red('𐄂')
      let text
      if (fileNames && testFile) {
        const filePath = relative(cwd, testFile)
        text = `${sign} ${name} (${filePath} in ${browserName})`
      } else if (testFile) {
        text = `${sign} ${name} (in ${browserName})`
      } else {
        text = `${sign} ${name}`
      }
      logger.log(ok ? text : bold(text))
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

    if (!dots) logger.log()

    totals.files += 1
  }

  const coverageTypes = ['statements', 'branches', 'functions', 'lines']

  function reportCoverage({ passed, summary }) {
    const sumPercent = coverageTypes.reduce((result, type) => result + summary[type].pct, 0)
    const avgPercent = Math.round((sumPercent * 100) / 4) / 100

    if (!Number.isNaN(avgPercent)) {
      const percent = `${avgPercent}%`
      logger.log(`Total code coverage: ${passed ? green(percent) : bold(red(percent))}`)
    }

    const { threshold } = coverageConfig
    if (threshold) {
      if (dots) {
        if (!passed) {
          for (const type of coverageTypes) {
            const expected = threshold[type]
            const { pct: actual } = summary[type]
            if (actual < expected) {
              logger.log(`Coverage for ${bold(type)} failed with ${bold(red(`${actual}%`))} `
                + `compared to configured ${expected}%`)
            }
          }
        }
      } else {
        for (const type of coverageTypes) {
          const expected = threshold[type]
          const { pct: actual } = summary[type]
          const result = actual < expected ? bold(red('does not meet')) : green('meets')
          logger.log(`Coverage for ${type} (${actual}'%) ${result} global threshold (${expected}%)`)
        }
      }
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
        if (failed) failedText = bold(red(failedText))
        logger.log(`${name}: ${files} files, ${suites} suites, ${tests} tests, `
          + `${passedText}, ${failedText}, ${skipped} skipped in ${seconds}s`)
      }
    }
  }
}
