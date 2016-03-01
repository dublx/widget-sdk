export PATH := ./node_modules/.bin:${PATH}

.PHONY: build

dist/app.html: app.html dist/app.js
	cp $< $@
	echo "<script>" >> $@
	cat dist/app.js >> $@
	echo "</script>" >> $@

dist/app.js: app.js
	browserify \
		--transform [ babelify --presets es2015 ] \
		--entry $< \
		| uglifyjs - \
		--compress \
		--output $@

