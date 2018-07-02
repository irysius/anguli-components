var gulp = require('gulp');
var exec = require('child_process').exec;
var clean = require('gulp-clean');
var sequence = require('run-sequence');
var typingsUtil = require('@irysius/typings-util');

// build: compiles the TypeScript in src/ and dumps the output in build/
gulp.task('build', (done) => {
    sequence('clean-build', 'compile', 'copy', 'clean-src', done);
});
gulp.task('compile', (done) => {
    exec('node-tsc -p ./src', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        done(); // continue even if there's errors.
    });
});
gulp.task('copy', () => {
    return gulp.src(['src/**/*.js']).pipe(gulp.dest('build'));
});
gulp.task('clean-build', () => {
    return gulp.src(['build/**/*.*']).pipe(clean());
});
gulp.task('clean-src', () => {
    return gulp.src(['src/**/*.js']).pipe(clean());
});

// declaration-build: compiles the TypeScript in src/, and generates typings appropriate for publishing.
gulp.task('declaration', (done) => {
    exec('node-tsc -p ./src -d', (err, stdout, stderr) => {
        done(); // continue even if there's errors.
    });
});
gulp.task('declaration-copy', () => {
    return gulp.src([
        'src/**/*.d.ts'
    ]).pipe(gulp.dest('types'));
});
gulp.task('declaration-commonjs', () => {
    return typingsUtil.commonjs('./types', '@irysius/anguli-components', './commonjs');
});
gulp.task('declaration-amd', () => {
    return typingsUtil.amd('./types', '@irysius/anguli-components', './common.d.ts');
});
gulp.task('declaration-clean', () => {
    return gulp.src([
        '**/*.d.ts',
        '!node_modules/**/*.d.ts', // do not clean declarations in node_modules
        '!commonjs/**/*.d.ts', // do not clean commonjs declaration outputs
        '!common.d.ts', // do not clean merged project declaration
    ]).pipe(clean());
});
gulp.task('declaration-clean-amd', () => {
    return gulp.src(['common.d.ts']).pipe(clean());
});
gulp.task('declaration-clean-commonjs', () => {
    return gulp.src(['commonjs/**/*.d.ts']).pipe(clean());
});
gulp.task('declaration-move', () => {
    return gulp.src(['commonjs/**/*.*']).pipe(gulp.dest('./'));
});
gulp.task('declaration-local', (done) => {
    sequence('declaration', 'declaration-copy', 'declaration-amd', 'declaration-clean', 'declaration-clean-commonjs', done);
});
gulp.task('declaration-publish', (done) => {
    sequence('declaration', 'declaration-copy', 'declaration-commonjs', 'declaration-clean', 'declaration-move', 'declaration-clean-commonjs', done);
});

gulp.task('default', ['build', 'declaration-local']);
gulp.task('prepare', ['build', 'declaration-publish']);
gulp.task('postpublish', ['declaration-clean']);