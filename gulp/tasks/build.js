// gulpfile.js
const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const { join } = require("path").posix;

const distPath = "dist";
const serverSource = "src/**/*.ts";
const serverTarget = distPath;

const gulpRoot = join(process.cwd());
const distServerDir = join(gulpRoot, "dist");
const distServerDbDir = join(distServerDir, "database");
const srcServerDir = join(gulpRoot, "src");
const srcServerDbDir = join(srcServerDir, "database");

const copyData = [
  { source: [`${srcServerDbDir}/*.*`, `!${srcServerDbDir}/*.ts`], dest: distServerDbDir }
]

function handleError(err) {
  console.log(err);
  this.emit('end');
}
function build(src, dest) {
  const tsProj = ts.createProject('tsconfig.json');

  return new Promise((resolve, reject) => {
    gulp.src(src)
      .pipe(sourcemaps.init())
      .pipe(tsProj()).on("error", handleError)
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(dest))
      .on("finish", resolve)
      .on("error", reject);
  })
};

async function buildServer(done) {
  await build(serverSource, serverTarget);
  done();
}

function copyDefaultFiles(src, dest) {
  console.log(`copyDefaultFiles from: ${src} --> ${dest}`);
  return new Promise((resolve, reject) => {
    gulp.src(src).pipe(gulp.dest(dest))
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function copyAction(done) {
  copyData.forEach(async (current) => {
    await copyDefaultFiles(current.source, current.dest);
  });
  done();
}

function watch() {
  gulp.watch("./src/**/*", buildServer);
}

gulp.task("build", gulp.series(buildServer, copyAction));
// gulp.task("build", buildNormal);
gulp.task("build:watch", watch);