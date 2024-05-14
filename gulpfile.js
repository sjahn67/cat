'use strict';

var gulp = require('gulp');
var HubRegistry = require('gulp-hub');

// load some files into the registry
var hub = new HubRegistry(['gulp/tasks/*.js']);

// tell gulp to use the tasks just loaded
gulp.registry(hub);

// define composite tasks
// NOTE HEY, STOP REMOVING PIPELINE STEPS!
gulp.task('default', gulp.series('clean', 'build'));

// NOTE When test appears back in here, KEEP IT HERE. Without tests we are BLIND to what we're doing!
gulp.task('checkAndBuild', gulp.parallel('packageCheck', 'tslint', 'build'));

gulp.task("dist", gulp.series(
  'clean',
  'build'
));