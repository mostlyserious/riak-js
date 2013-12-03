MOCHA_OPTS=-t 20000
TEST_SHARED=test/*-test.js
TEST_1_4=test/1.4-specific/*-test.js
TEST_2_0=test/2.0-specific/*-test.js
REPORTER = spec

check: test

test: test-unit
test_2_0: test-unit-2.0

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	    --reporter $(REPORTER) \
		$(MOCHA_OPTS) \
		$(TEST_SHARED) \
		$(TEST_1_4)

test-unit-2.0:
	@NODE_ENV=test ./node_modules/.bin/mocha \
	    --reporter $(REPORTER) \
		$(MOCHA_OPTS) \
		$(TEST_SHARED) \
		$(TEST_2_0)

.PHONY: test
