gen: deps
	@find src -name '*.coffee' | xargs coffee -c -o lib
	@ln -sf src/riak.desc lib

deps:
	@test `which coffee` || echo 'You need to have CoffeeScript in your PATH.\nPlease install it using `brew install coffee-script` or `npm install coffee-script`.'

test: deps
	@find test -name '*.coffee' | xargs ls
	
.PHONY: gen deps test