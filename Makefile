LOCAL_BIN=node_modules/.bin

default: build min

build:
	@echo "browserifying"
	@${LOCAL_BIN}/browserify --standalone signaller index.js > dist/signaller.js

min:
	@echo "uglifying"
	@${LOCAL_BIN}/uglifyjs < dist/signaller.js > dist/signaller.min.js

clean:
	@rm dist/*.js