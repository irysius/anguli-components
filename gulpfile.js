var gulp = require('gulp');
var exec = require('child_process').exec;
var clean = require('gulp-clean');
var sequence = require('run-sequence');
var generateDeclaration = require('@irysius/typings-util');

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

// declaration-compile - generates .d.ts from the TypeScript files
gulp.task('declaration-compile', (done) => {
    exec('node-tsc -d', (err, stdout, stderr) => {
        done(); // continue even if there's errors.
    });
});

// declaration-copy - copies .d.ts to the types folder
gulp.task('declaration-copy', () => {
    return gulp.src([
        'src/**/*.d.ts'
    ]).pipe(gulp.dest('types'));
});

// declaration-clean - removes unwanted .d.ts, and removes .d.ts from the src folder
gulp.task('declaration-clean', () => {
    return gulp.src([
        'main.d.ts',
        'check.d.ts',
        'src/**/*.d.ts',
        'tests/**/*.d.ts',
        'types/**/*.d.ts'
    ]).pipe(clean());
});

// declaration-generate - generates a unified declaration
gulp.task('declaration-generate', () => {
    return generateDeclaration('./types', '@irysius/anguli-components', './index.d.ts');
});

gulp.task('build', (done) => {
    sequence('compile', 'copy', 'clean', done);
});

gulp.task('build-declaration', (done) => {
    sequence('declaration-compile', 'declaration-copy', 'declaration-generate', 'declaration-clean', done);
});

gulp.task('default', ['build', 'build-declaration']);
gulp.task('prepare', ['build']);