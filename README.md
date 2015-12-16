# reduce-js
[![version](https://img.shields.io/npm/v/reduce-js.svg)](https://www.npmjs.org/package/reduce-js)
[![status](https://travis-ci.org/zoubin/reduce-js.svg?branch=master)](https://travis-ci.org/zoubin/reduce-js)
[![coverage](https://img.shields.io/coveralls/zoubin/reduce-js.svg)](https://coveralls.io/github/zoubin/reduce-js)
[![dependencies](https://david-dm.org/zoubin/reduce-js.svg)](https://david-dm.org/zoubin/reduce-js)
[![devDependencies](https://david-dm.org/zoubin/reduce-js/dev-status.svg)](https://david-dm.org/zoubin/reduce-js#info=devDependencies)

Use [browserify](https://www.npmjs.com/package/browserify)
and [factor-vinylify](https://www.npmjs.com/package/factor-vinylify)
to pack node-style modules into a single bundle or multiple bundles.

It generates a [vinyl](https://www.npmjs.com/package/vinyl) stream,
which can be transformed by [gulp](https://www.npmjs.com/package/gulp) plugins.

## Examples

Check [examples](example/).

```javascript
var gulp = require('gulp')
var reduce = require('reduce-js')
var path = require('path')
var uglify = require('gulp-uglify')
var del = require('del')

var onerror = function (err) {
  console.log(err.message)
}

var bundleOpts = {
  // Options passed to `factor-vinylify`
  // Refer to `https://github.com/zoubin/factor-vinylify#options` for more information.
  factor: {
    // One bundle for each entry detected from `.src()`.
    needFactor: true,

    // If omitted, no common bundle will be created.
    common: 'common.js',
  },

  // And all options passed to `browserify`
  // Refer to `https://github.com/substack/node-browserify#methods` for more information

  basedir: path.join(__dirname, 'src'),

  // Now, we can `require('lib/world')` anywhere under the `src` directory.
  // Otherwise, we have to write relative paths like `require('../../web_modules/lib/world')`
  paths: [path.join(__dirname, 'src', 'web_modules')],
}

gulp.task('clean', function () {
  return del(path.join(__dirname, 'build'))
})

// Pack all JS modules into multiple bundles.
gulp.task('build', ['clean'], function () {
  reduce.on('log', console.log.bind(console))
  reduce.on('error', onerror)

  // The first argument is passed to globby.
  // Refer to `https://github.com/sindresorhus/globby#globbypatterns-options` for more information
  return reduce.src('page/**/index.js', bundleOpts)
    // `pipe` into gulp-plugins
    .pipe(uglify())
    .pipe(gulp.dest('build'))
})

// To keep `watch` unfinished, declare `cb` as the first argument of the task callback
gulp.task('watch', ['clean'], function (cb) {
  var watcher = reduce.watch()
  watcher.on('log', console.log.bind(console))
  watcher.on('error', onerror)

  // The first argument is passed to globby.
  // Refer to `https://github.com/sindresorhus/globby#globbypatterns-options` for more information
  watcher.src('page/**/index.js', bundleOpts)
    // `pipe` into lazy transforms, i.e. functions to create transforms
    .pipe(uglify)
    .pipe(gulp.dest, 'build')
})

```

## API

### reduce.src(patterns, bopts)

Creates a vinyl file stream to flow all the bundle file objects,
which can be transformed by gulp plugins.

#### patterns

Type: `String`, `Array`

Used by [globby](https://github.com/sindresorhus/globby) to locate entries.

#### bopts

Options to create the browserify instance.

Fields not explained in the following sections
are the same with those in [browserify](https://github.com/substack/node-browserify#browserifyfiles--opts)

#### basedir

Type: `String`

Default: `process.cwd()`

Used as the `cwd` field of the options passed to globby.

#### factor

Type: `Object`

Options passed to [factor-vinylify](https://github.com/zoubin/factor-vinylify#options).

### r = reduce.Reduce()
Create a new reduce instance

### w = reduce.watch(watchifyOpts)

Creates a watch instance.

`watchifyOpts` will be passed to [watchify](https://github.com/substack/watchify).

#### w.src(pattern, opts)

The same with `reduce.src`.

#### w.pipe(fn, arg1, arg2,...)

Like [lazypipe](https://github.com/OverZealous/lazypipe).
Just pass the stream constructor and its arguments to `.pipe`,
and they will be called to create a pipeline
for transforming the output stream.


### reduce.dest

The same with [gulp.dest](https://github.com/gulpjs/gulp/blob/master/docs/API.md#gulpdestpath-options)

### reduce.lazypipe

The same with [lazypipe](https://github.com/OverZealous/lazypipe)

### reduce.run

The same with [callback-sequence#run](https://github.com/zoubin/callback-sequence#sequenceruncallbacks-done)

### Events

#### reduce.on('instance', (b) => {})

`b` is the underlying browserify instance.

```javascript

reduce.on('instance', function (b) {
  b.transform(envify)
})
.src('*.js', opts)
.pipe(reduce.dest('build'))

```

#### reduce.watch().on('instance', (b) => {})

## Watch

`reduce.src` generates a vinyl stream,
which could be transformed by gulp-plugins.

However, `reduce.watch().src` generates a [lazypipe](https://github.com/OverZealous/lazypipe) instance,
and will bundle in the next tick.

In normal mode,
you just `pipe` streams.

```javascript
var factorOpts = {
  outputs: ['a.js', 'b.js'],
  common: 'common.js',
};
gulp.task('factor', ['clean'], function () {
  return reduce.src('*.js', { basedir: basedir, factor: factorOpts })
    .pipe(uglify())
    .pipe(gulp.dest('build'));
});
```

In watch mode,
you should `pipe` stream constructors.

```javascript
var factorOpts = {
  outputs: ['a.js', 'b.js'],
  common: 'common.js',
};
gulp.task('factor.watch', ['clean'], function (cb) {
  reduce.watch()
    .src('*.js', { basedir: basedir, factor: factorOpts })
    .pipe(uglify)
    .pipe(gulp.dest, 'build');
});
```

You can use `lazypipe` to make things clear:

```javascript
var reduce = require('reduce-js');
var lazypipe = reduce.lazypipe()
  .pipe(uglify)
  .pipe(gulp.dest, 'build');

var factorOpts = {
  outputs: ['a.js', 'b.js'],
  common: 'common.js',
};
gulp.task('factor', ['clean'], function () {
  return reduce.src('*.js', { basedir: basedir, factor: factorOpts })
    .pipe(lazypipe());
});
gulp.task('factor.watch', ['clean'], function (cb) {
  reduce.watch()
    .src('*.js', { basedir: basedir, factor: factorOpts })
    .pipe(lazypipe);
});
```

## Without Gulp

Actually, `gulp` is not necessary.
`reduce.dest` can be always used in place of `gulp.dest`.
Use `reduce.run` to run the task.

```javascript
var reduce = require('reduce-js');
var path = require('path');

var basedir = path.join(__dirname, 'src');
var factorOpts = {
  outputs: ['a.js', 'b.js'],
  common: 'common.js',
};

var del = require('del');

reduce.run([clean, bundle]).then(function () {
  console.log('DONE')
})

function clean() {
  return del(path.join(__dirname, 'build'));
}

function bundle() {
  return reduce
    .on('log', console.log.bind(console))
    .on('error', console.log.bind(console))
    .src('*.js', { basedir: basedir, factor: factorOpts })
    .pipe(reduce.dest('build'));
}

```

