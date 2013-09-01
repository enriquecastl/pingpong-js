module.exports = function(grunt){

    grunt.initConfig({
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
            ts : {
                files : ['server/*.ts', 'client/app/*.ts'],
                tasks : ['typescript']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-typescript');
};