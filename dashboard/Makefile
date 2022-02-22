# The following Makefile magic looks in src/ 
# and runs the commands for any *.js file found. 
SRC = $(wildcard src/*.js)
DIST = $(SRC:src/%.js=dist/%.js)

dist: $(DIST)
dist/%.js: src/%.js babel.config.json
	mkdir -p $(@D)
	npx babel $< -o $@

clean:
	rm -rf dist

update:
	npm update

