module.exports = function (grunt) {
	grunt.initConfig({
		'babel': {
			options: {
				sourceMap: false,
				presets: ['es2015']
			},
			dist: {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: ['**/*.js'],
						dest: 'dist/',
						ext: '.js'
					}
				]
			}
		},
		'clean': {
			publish: ['dist/', 'build/']	
		},
		'copy': {
			publish: {
				files: [{
					expand: true,
					cwd: 'dist/',
					src: ['**/*.*'],
					dest: 'build/'	
				}]
			}
		},
		'watch': {
			scripts: {
				files: 'src/*.js',
				tasks: ['babel']
			}
		}
	});

	grunt.loadNpmTasks('grunt-babel');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.registerTask('default', ['babel']);
	grunt.registerTask('publish', ['clean:publish', 'babel', 'copy:publish']);
}