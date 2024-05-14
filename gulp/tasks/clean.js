const del = require('del');
const gulp = require('gulp');

function clean(done) {
  del("dist/**");
  done();
}

gulp.task("clean", clean);