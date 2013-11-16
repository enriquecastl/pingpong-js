module.exports = function(grunt){

    grunt.initConfig({
        less : {
            prod : {
                options : {
                    compress : true
                },
                files : {
                    'client/css/app.css' : 'client/less/app.less'
                }
            }
        },
        typescript : {

            server : {
                src : ['server/*.ts'],
                dest : 'server/main.js',
                options : {
                    module : 'commonjs',
                    allowimportmodule : true,
                    ignoreTypeCheck : true
                }
            },
            client : {
                src : ['client/app/*.ts'],
                dest : 'client/app/main.js',
                options : {
                    module : 'commonjs',
                    allowimportmodule : true,
                    ignoreTypeCheck : true
                }
            }
        },
        watch : {
            tsClient : {
                files : ['client/app/*.ts'],
                tasks : ['typescript:client']
            },
            tsServer : {
                files : ['server/*.ts'],
                tasks : ['typescript:server']
            },
            less : {
                files : ['client/less/*.less'],
                tasks : ['less:prod']
            },
            build : {
                files : ['client/**/*.js', 'client/**/*.css', 'client/index.html'],
                tasks : ['build']
            }
        },
        'bower-install': {
            prod: {

                // Point to the html file that should be updated
                // when you run `grunt bower-install`
                html: 'client/index.html',

                // Optional:

                // If your file paths shouldn't contain a certain
                // portion of a url, it can be excluded

                ignorePath : 'client/',

                // Customize how your stylesheets are included on
                // your page.
                //
                //   default: '<link rel="stylesheet" href="{{filePath}}" />'
                cssPattern: '<link href="{{filePath}}" rel="stylesheet" type="text/css">',

                // Customize how your <script>s are included into
                // your HTML file.
                //
                //   default: '<script src="{{filePath}}"></script>'
                jsPattern: '<script type="text/javascript" src="{{filePath}}" type="text/javascript"></script>'
            }
        },
        clean : {
            tmp : {
                src : [".tmp"]
            },
            dist : {
                src : [".tmp", "dist"]
            }
        },
        'useminPrepare' : {
            html : 'client/index.html',
            options : {
                dest : 'dist',
                root : 'client'
            }
        },
        usemin : {
            html : 'dist/index.html'
        },
        copy : {
            generate : {
                files : [ 
                    { expand : true, cwd : 'client', src : ['index.html'], dest : 'dist/' },
                    { expand : true, cwd : 'client', src : ['img/*'], dest : 'dist/' }
                ]
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'useminPrepare',
        'concat',
        'uglify',
        'copy:generate',
        'cssmin',
        'usemin',
        'clean:tmp'
    ]);
    
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-bower-install');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-typescript');
};