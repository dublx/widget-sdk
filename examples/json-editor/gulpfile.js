var gulp = require('gulp');
var serve = require('gulp-serve');
var inlinesource = require('gulp-inline-source');

gulp.task('default', ['copy', 'serve', 'bundle']);

// Serve dist folder on port 3000 for local development
gulp.task('serve', serve('dist'));

// Copy required dependencies into dist folder
gulp.task('copy', function() {

  var files = [
    'index.html',
    'style.css',
    'json-editor.js'
  ];

  var dependencies = [
    '../../dist/cf-widget-api.js',
    'node_modules/codemirror/lib/codemirror.css',
    'node_modules/codemirror/lib/codemirror.js',
    'node_modules/codemirror/addon/edit/closebrackets.js',
    'node_modules/codemirror/addon/edit/matchbrackets.js',
    'node_modules/codemirror/mode/javascript/javascript.js'
  ];

  gulp.src(files)
    .pipe(gulp.dest('./dist'));

  gulp.src(dependencies)
    .pipe(gulp.dest('./dist/lib'));

});

// Inlines all external scripts and stylesheets that have the inline attribute
// Outputs the index.all.html file into the dist folder
// This can be used with the widget srcdoc option to upload all widget code to Contentful
gulp.task('bundle', function() {
  gulp.src('index.all.html')
    .pipe(inlinesource())
    .pipe(gulp.dest('./dist'));
});
