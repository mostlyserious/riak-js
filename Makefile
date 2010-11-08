generate-js: deps
	@find src -name '*.coffee' | xargs coffee -c -o lib
	@ln -sf src/riak.desc lib

remove-js:
	@rm -fr lib/

deps:
	@test `which coffee` || echo 'You need to have CoffeeScript in your PATH.\nPlease install it using `brew install coffee-script` or `npm install coffee-script`.'

test: deps
	@test `which vows` || echo 'You need vows to test this library. Install via "npm install vows@0.5.2".'
	@vows spec/test_* --spec

dev: generate-js
	@coffee -wc --no-wrap -o lib src/*.coffee

.PHONY: generate-js remove-js deps test dev