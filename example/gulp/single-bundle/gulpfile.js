'use strict'

const reduce = require('../../..')
const gulp = require('gulp')
const path = require('path')
const del = require('del')

gulp.task('clean', function () {
  return del(path.join(__dirname, 'build'))
})

gulp.task('build', ['clean'], function () {
  let b = createBundler()
  return gulp.src('page/**/index.js', { cwd: b._options.basedir })
    .pipe(reduce.bundle(b, 'bundle.js'))
    .pipe(gulp.dest('build'))
})

gulp.task('watch', ['clean'], function (cb) {
  let b = createBundler()
  b.plugin(require('clean-remains')([]))
  b.on('bundle-stream', function (bundleStream) {
    bundleStream.pipe(gulp.dest('build'))
  })
  gulp.src('page/**/index.js', { cwd: b._options.basedir })
    .pipe(reduce.watch(b, 'bundle.js', { entryGlob: 'page/**/index.js' }))
})

function createBundler() {
  let basedir = path.join(__dirname, 'src')
  let b = reduce.create({
    basedir: basedir,
    paths: [path.join(basedir, 'web_modules')],
    fileCache: {},
    cache: {},
    packageCache: {},
  })

  b.on('error', console.log.bind(console))
  b.on('common.map', function (map) {
    console.log('bundles:', '[ ' + Object.keys(map).join(', ') + ' ]')
  })

  return b
}

