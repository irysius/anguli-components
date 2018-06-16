var gulp = require('gulp');
var exec = require('child_process').exec;

gulp.task('compile', (done) => {
    exec('node-tsc', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        done(); // continue even if there's errors.
    });
});

gulp.task('default', ['compile']);
gulp.task('prepare', ['compile']);