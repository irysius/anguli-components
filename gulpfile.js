var gulp = require('gulp');
var exec = require('child_process').exec;
var clean = require('gulp-clean');
var sequence = require('run-sequence');

// compile - compiles typescript into javascript
gulp.task('compile', (done) => {
    exec('node-tsc', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        done(); // continue even if there's errors.
    });
});

// copy - copies compiled javascript to the build folder
gulp.task('copy', () => {
    return gulp.src([
        'src/**/*.js'
    ]).pipe(gulp.dest('build'));
});

// clean - removes compiled javascript in the src folder
gulp.task('clean', () => {
    return gulp.src([
        'src/**/*.js'
    ]).pipe(clean());
});

gulp.task('build', (done) => {
    sequence('compile', 'copy', 'clean', done);
});

gulp.task('default', ['build']);
gulp.task('prepare', ['build']);