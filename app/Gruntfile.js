module.exports = (grunt) => {

    grunt.file.setBase('..');
    // eslint-disable-next-line import/no-extraneous-dependencies
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        clean: {},

        express: {
            dev: {
                options: {
                    script: 'app/index.js',
                    node_env: 'dev',
                    port: process.env.PORT,
                    output: 'started'
                }
            }
        },

        mochaTest: {
            e2e: {
                options: {
                    reporter: 'spec',
                    quiet: false,
                    timeout: 10000,
                    clearRequireCache: true, // Optionally clear the require cache before running tests (defaults to false)

                },
                src: ['app/test/e2e/**/*.spec.js']
            }
        },
        watch: {
            options: {
                livereload: false
            },
            jssrc: {
                files: [
                    'app/src/**/*.js',
                ],
                tasks: ['jshint:js', 'mochaTest:unit', 'express:dev'],
                options: {
                    spawn: false
                }
            },
            unitTest: {
                files: [
                    'app/test/unit/**/*.test.js',
                ],
                tasks: ['jshint:jsTest', 'mochaTest:unit'],
                options: {
                    spawn: false
                }
            },
            e2eTest: {
                files: [
                    'app/test/unit/**/*.spec.js',
                ],
                tasks: ['jshint:jsTest', 'mochaTest:e2e'],
                options: {
                    spawn: false
                }
            },

        },

        nyc: {
            cover: {
                options: {
                    include: ['app/src/**'],
                    exclude: '*.test.*',
                    reporter: ['lcov', 'text-summary'],
                    reportDir: 'coverage',
                    all: true
                },
                cmd: false,
                args: ['grunt', '--gruntfile', 'app/Gruntfile.js', 'mochaTest:e2e']
            }
        }
    });

    grunt.registerTask('test', ['mochaTest:e2e']);

    grunt.registerTask('serve', ['express:dev', 'watch']);

    grunt.registerTask('default', 'serve');

    grunt.loadNpmTasks('grunt-simple-nyc');

};
