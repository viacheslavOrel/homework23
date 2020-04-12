const gulp = require('gulp');
const sass = require('gulp-sass');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const rf = require('gulp-remove-files');
const browserSync = require('browser-sync');

gulp.task('clear', () => gulp.src('./dist/*')
    .pipe(rf()));

gulp.task('sass', done => {
  gulp.src('./src/**/*.+(scss|sass)')
    .pipe(sass())
    .pipe(concat('style.css'))
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.reload({
      stream: true,
    }));
  done();
});

gulp.task('babel', done => {
  gulp.src('./src/**/*.js')
    .pipe(babel({
      "plugins": ['@babel/plugin-proposal-class-properties']
    }))
    .pipe(concat('script.js'))
    .pipe(gulp.dest('./dist'))
    .pipe(browserSync.reload({
      stream: true,
    }));
  done();
});

gulp.task('serve', () => {
  browserSync.init({
    server: './',
  });

  gulp.watch('./src/**/*.+(sass|scss)', gulp.series('sass'));
  gulp.watch('./src/**/*.js', gulp.series('babel'));
  gulp.watch('index.html').on('change', browserSync.reload);
});

gulp.task('default', gulp.series('clear', 'babel', 'sass', 'serve'));
