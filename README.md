# web-optional-dots-reporter

[![Latest version](https://img.shields.io/npm/v/web-optional-dots-reporter)
 ![Dependency status](https://img.shields.io/librariesio/release/npm/web-optional-dots-reporter)
](https://www.npmjs.com/package/web-optional-dots-reporter)

A test reporter compatible with [@web/test-runner], which can print either dots or test suites and test names ans which supports test coverage.

## Installation

Using `npm`:

    npm i -D web-optional-dots-reporter

## Usage

Create a [configuration file] `web-test-runner.config`, import the reporter and create it:

```js
import { optionalDotsReporter } from 'web-optional-dots-reporter';

export default {
  reporters: [
    optionalDotsReporter()
  ]
}
```

The exported function creates a new test reporter compatible with `@web/test-runner`:

```ts
function optionalDotsReporter(options?): Reporter
```

## Options

The function `optionalDotsReporter` expects optionally an object with the following properties:

### `dots`

Type: `boolean`<br>
Default: `process.stdout.isTTY`

If dots should be printed instead ot names of test suites and tests.

### `fileNames`

Type: `boolean`<br>
Default: `false`

If the test file names should be printed alongside the test suite names.

### `reportResults`

Type: `boolean`<br>
Default: `true`

If each test result should be printed before the test summary.

## Examples

Successful test run, dots enabled:

    > web-test-runner

    ...........................................................

    Chrome: 47 files, 236 suites, 574 tests, 566 passed, 0 failed, 8 skipped in 4.5s

Failing test run, dots and browser log enabled:

    > web-test-runner

    ....................x.....................................

    🚧 Browser logs on Chrome:
          Lit is in dev mode. Not recommended for production!
          See https://lit.dev/msg/dev-mode for more information.

    🚧 404 network requests on Chrome:
        - testNotExistingImg.svg

    ❌ HolyGrailElement > offers slots
          AssertionError: unexpected slot "nav-bottom": expected false to be true
          + expected - actual

          -false
          +true

          at o.<anonymous> (src/components/holy-grail/holy-grail.test.js:24:78)

    Chrome: 47 files, 236 suites, 574 tests, 565 passed, 1 failed, 8 skipped in 5.0s

Failing test run, dots disabled:

    > web-test-runner

    HolyGrailElement
      𐄂 offers slots
      ✓ exposes parts (slot parents)
      ✓ hides side parts if their slots are empty
      ✓ shows side parts if their slots are not empty

    ❌ HolyGrailElement > offers slots
          AssertionError: unexpected slot "nav-bottom": expected false to be true
          + expected - actual

          -false
          +true

          at o.<anonymous> (src/components/holy-grail/holy-grail.test.js:24:78)

    Chrome: 47 files, 236 suites, 574 tests, 566 passed, 0 failed, 8 skipped in 5.6s

Failing test run (insufficient coverage only), dots disabled:

    > web-test-runner

    HolyGrailElement
      ✓ offers slots
      ✓ exposes parts (slot parents)
      ✓ hides side parts if their slots are empty
      ✓ shows side parts if their slots are not empty

    Coverage for statements (82.64'%) meets global threshold (70%)
    Coverage for branches (79.92'%) meets global threshold (70%)
    Coverage for functions (64.66'%) does not meet global threshold (70%)
    Coverage for lines (82.64'%) meets global threshold (70%)

    Chrome: 47 files, 236 suites, 574 tests, 566 passed, 0 failed, 8 skipped in 5.4s

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Lint and test your code.

## License

Copyright (C) 2023 Ferdinand Prantl

Licensed under the [MIT License].

[MIT License]: http://en.wikipedia.org/wiki/MIT_License
[@web/test-runner]: https://modern-web.dev/docs/test-runner/overview/
[configuration file]: https://modern-web.dev/docs/test-runner/cli-and-configuration/#configuration-file
