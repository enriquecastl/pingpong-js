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
                cssPattern: '<link href="{{filePath}}" rel="stylesheet">',

                // Customize how your <script>s are included into
                // your HTML file.
                //
                //   default: '<script src="{{filePath}}"></script>'
                jsPattern: '<script type="text/javascript" src="{{filePath}}"></script>'
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-install');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');
};