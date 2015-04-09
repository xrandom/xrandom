module.exports = function(grunt) {
 
    grunt.initConfig({
        uglify: {
            debug: {
                files: {
                    'static/js/app.min.js': [   
                        'config/frontend.debug.js',             
                        'static/src/js/*', 
                    ]
                },
                options: {
                    beautify: true,
                    mangle: false
                }
            },
            release: {
                files: {
                    'static/js/app.min.js': [
                        'config/frontend.release.js',
                        'static/src/js/*',
                    ]
                },
                options: {
                    compress: {
                        drop_console: true
                    },
                    mangle: true
                },
            }
        },
        cssmin: {
            target: {
                options: {
                    advanced: false,
                },
                files: {
                    'static/css/style.min.css': [
                        'static/src/css/reset.css',
                        'static/src/css/jumping.css',
                        'static/src/css/common.css',
                        'static/src/css/headers.css',
                        'static/src/css/menu.css',
                        'static/src/css/app.css',
                        'static/src/css/videos.css',
                        'static/src/css/hint.css',
                        'static/src/css/page.css',
                        'static/src/css/share.css',
                    ]
                }
            }
        },
        watch: {
          scripts: {
            files: [
                'static/src/js/*',
                'config/frontend.debug.js'
            ],
            tasks: ['uglify:debug']
          },
          css: {
            files: [
                'static/src/css/*'
            ],
            tasks: ['cssmin']
          }
        },      
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['uglify:debug', 'cssmin']);
    grunt.registerTask('debug', ['uglify:debug', 'cssmin']);
    grunt.registerTask('release', ['uglify:release', 'cssmin']);
};
