LOCAL_BIN=node_modules/.bin

default: build min

docs:
	sourcecat | emu > README.md

lint:
	@jshint index.js processor.js handlers/*.js

build:
	@echo "browserifying"
	node build.js > dist/signaller.js

min:
	@echo "uglifying"
	@${LOCAL_BIN}/uglifyjs < dist/signaller.js > dist/signaller.min.js

clean:
	@rm dist/*.js