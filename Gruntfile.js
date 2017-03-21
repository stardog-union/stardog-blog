//require('load-grunt-tasks')(grunt);

module.exports = function(grunt) {
    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        stylus: {
          compile: {
              options: {
                  paths: ["node_modules/axis/",
                          "node_modules/jeet/stylus/",
                          "node_modules/rupture/",
                  ],
                  urlfunc: "embedurl",
              },
              files: {
                  "static/css/s.css": "styl/s.styl"
              }
          }
        },
         shell: { 
             build: {
                 command: function () {
                     comm = "hugo"
                     return comm
                 },
             },
             update: {
                 command: function () {
                     comm = "npm update caniuse-db"
                     return comm
                 }
             },
         },
        autoprefixer: {
             single_file: {
                 options: {
                     browsers: ["> 1%", "ie10", "ie11"]
                 },
                 src: 'static/css/s.css',
                 dest: 'static/css/s.css'
             },
        },
        cssmin: {
            options: {
                report: 'min'
            },
            main: {
                expand: true,
                cwd: 'public/',
                src: '**/*.css',
                dest: 'public/'
            }
        },
        compress: {
            main: {
                options: { mode: 'gzip', pretty: true, level: 9},
                expand: true,
                cwd: "public/",
                src: ["**/*.html", "**/*.css"],
                dest: "preflight/",
            },
        },
        htmlmin: {
            dist: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true
                },
                expand: true,
                cwd: 'public',
                src: ['**/*.html'],
                dest: 'public/'
            }
        },
        concat: {
          css: {
              src: ['static/css/s.css', "node_modules/grunt-highlight/node_modules/highlight.js/styles/tomorrow.css"],
              dest: 'static/css/s.css'
          },
        },
   dom_munger: {
    archive: {
      options: {
        read: [
          //{selector:'link',attribute:'href',writeto:'myCssRefs',isPath:true},
          //{selector:'script[src]',attribute:'src',writeto:'myJsRefs',isPath:true}
        ],
          //remove: 'div#archiveblock>div#archiveitem:first-child',
          remove: "#archiveblock>div:first-child"
      },
      src: 'public/archive/index.html', //could be an array of files
    },
  },
  highlight: {
    task: {
      options: {},
        expand: true,
        cwd: 'public',
        src: ["**/*.html"],
        dest: "public/"
    }
  },
        clean: {
            build: ["public/*", "preflight/*"],
        },
  });


    require('matchdep').filter('grunt-*').forEach(grunt.loadNpmTasks);
    grunt.registerTask('cl', ['clean:build','shell:update']);
    grunt.registerTask("css", ["stylus","concat", "cssmin"]);
    grunt.registerTask("cssdev", ["stylus", "concat"]);
    grunt.registerTask("push_production", ["aws_s3:production", "aws_s3:gzipd"]);
    grunt.registerTask("hugo", ["shell:build"]);
    grunt.registerTask("kill", ["cloudfront:all"]);
    grunt.registerTask('dev', ['clean:build',
                               'css',
                               'shell:build',
                               'dom_munger:archive'
                              ]);
    grunt.registerTask("build", ['clean:build',
                               "css",
                               "shell:update",
                               "autoprefixer",
                               "hugo",
                               "dom_munger:archive",
                               "htmlmin",
                               "compress",
                              ]);
        };
