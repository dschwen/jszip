CODE_DIR = src

.PHONY: all

all: src/jzip.js

src/jzip.js:
	$(MAKE) -C $(CODE_DIR) -f emscripten.mak

install: src/jzip.js
	mkdir -p site
	cp -a src/jzip.wasm src/jzip.js jzip.html jzip.css storage.html storage.css storage.js map.html map.js data site

clean:
	$(MAKE) -C $(CODE_DIR) -f emscripten.mak clean
