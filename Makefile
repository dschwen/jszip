CODE_DIR = src

.PHONY: all

all:
	$(MAKE) -C $(CODE_DIR) -f emscripten.mak
	ln -sf $(CODE_DIR)/jzip.js .

clean:
	$(MAKE) -C $(CODE_DIR) -f emscripten.mak clean

