MOCHA_OPTS = -t 20000
REPORTER = spec

ifeq ($(RIAK_VERSION),default)
TESTS = test/*-test.js test/1.4-specific/*-test.js
else
TESTS = test/*-test.js test/2.0-specific/*-test.js
endif

check: test

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	    --reporter $(REPORTER) \
		$(MOCHA_OPTS) \
		$(TESTS)

.PHONY: test
