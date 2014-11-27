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
	curl -XPUT http://localhost:8098/buckets/test-riakjs/keys/test  -H "Content-Type: text/plain" -d "body"
	curl http://localhost:8098/buckets/test-riakjs/keys/test
	curl -XDELETE http://localhost:8098/buckets/test-riakjs/keys/test
	@NODE_ENV=test ./node_modules/.bin/mocha \
	    -i -g "1.4-specific" \
	    --reporter $(REPORTER) \
		$(MOCHA_OPTS) \
		$(TESTS)

.PHONY: test
