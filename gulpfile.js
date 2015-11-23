var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var sass        = require('gulp-sass');
var concat        = require('gulp-concat');

// Static Server + watching scss/html files
gulp.task('serve', ['sass', 'js'], function() {

    browserSync.init({
        server: "."
    });

    gulp.watch("app/scss/*.scss", ['sass']);
    gulp.watch("app/js/*.js", ['js']);
    gulp.watch("./*.html").on('change', browserSync.reload);
});

// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src("app/scss/*.scss")
        .pipe(sass())
        .pipe(gulp.dest("app/css"))
        .pipe(browserSync.stream());
});

// Concatenate and uglify JS
gulp.task('js', function() {
    return gulp.src("app/js/*.js")
        .pipe(concat('app.js'))
        .pipe(gulp.dest('./dist/'))
        .pipe(browserSync.stream());
});

gulp.task('default', ['serve']);