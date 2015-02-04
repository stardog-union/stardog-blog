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
         shell: { //me with ascidoctor.js
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
        //WARNING: never put this in a git repo dir...
        aws: grunt.file.readJSON("../../../grunt-aws-SECRET.json"),
        aws_s3: {
             options: {
                    accessKeyId: "<%= aws.secret %>", 
                    secretAccessKey: '<%= aws.key %>',
                    bucket: "<%= aws.bucket %>",
                    region: "us-east-1",
                    access: "public-read",
                    progress: "progressBar",
                    streams: true,
                    debug: false,
                    uploadConcurrency: 30,
                },

            production: {
                options: {
                    streams: true,
                    debug: false,
                    differential: true,
                params: {
                        "CacheControl": "max-age=63072000, public",
                        "Expires": new Date(Date.now() + 6.31139e10),//.toUTCString(),
                }
                },

                files: [
                    { expand: true, dest: '.', cwd: 'public/', src: ['**/*',"!**/*.html","!**/*.css"], action: 'upload', differential: true },
                    { dest: '/', cwd: 'public/', action: 'delete', differential: true }
                ]
            },
            gzipd: {
                options: {
                    streams: true,
                    debug: false,
                    differential: true,
                params: {
                    "CacheControl": "max-age=63072000, public",
                    "Expires": new Date(Date.now() + 6.31139e10),
                    "ContentEncoding": "gzip"
                }
                },
                files: [ {expand: true, dest: ".", cwd: "preflight/", src: ["**/*.html", "**/*.css"], action:"upload", differential:true}]
            },
            production_index: {
                options: {
                    streams: true,
                    debug: false,
                    differential: false,
                params: {
                    "CacheControl": "max-age=3600, public",
                    "Expires": new Date(Date.now() + 3600),
                    "ContentEncoding": "gzip"
                }
                },
                files: [
                    { expand: true, dest: '.', cwd: 'preflight/', src: ['index.html'], action: 'upload', differential: false}
                ]
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
  highlight: {
    task: {
      options: {},
        expand: true,
        cwd: 'public',
        src: ["**/*.html"],
        dest: "public/"
    }
  },
  cacheBust: {
    options: {
        encoding: 'utf8',
        algorithm: 'sha1',
        length: 16,
        baseDir: "public/"
        
    },
      assets: {
          expand: true,
          cwd: "public",
          src: ["**/*.html"],
          dest: "public/"
    }
  },
        availabletasks: {     
            tasks: {}
      },
        prompt: {
            target: {
                options: {
                    questions: [
                        {
                            config: 'config.invalidateTarget',
                            type: 'list', // list, checkbox, confirm, input, password
                            message: 'What do you want to invalidate?',
                            default: 'index', // default value if nothing is entered
                            choices: ["index", "all", "html", "none"],
                        }
                    ]
                }
            },
        },
        invalidate_cloudfront: {
          options: {
              key: "<%= aws.secret %>",
              secret: "<%= aws.key %>",
              distribution: 'E9J6BU91BD488'
            },
            all: {
                files: [{
                    expand: true,
                    cwd: 'public/',
                    src: ['**/*'],
                    filter: 'isFile',
                    dest: ''
                }]
            },
          index: {
              files: [
                  {
                      expand: true,
                      cwd: "preflight/",
                      src: "index.html",
                      dest: ''
                  }
              ]
          },
          html: {
              files: [
                  {
                      expand: true,
                      cwd: "preflight/",
                      src: "**/*.html",
                      dest: ''
                  }
              ]
          }
        },
      clean: {
          build: ["public/*", "preflight/*"],
      },
  });

    require('matchdep').filter('grunt-*').forEach(grunt.loadNpmTasks);
    grunt.registerTask('cl', ['clean:build','shell:update']);
    grunt.registerTask("css", ["stylus","concat", "cssmin"]);
    grunt.registerTask("push_production", ["aws_s3:production", "aws_s3:gzipd"]);
    grunt.registerTask("kill_html", ["invalidate_cloudfront:html"]);
    grunt.registerTask("hugo", ["shell:build"]);
    grunt.registerTask('printConfig', function() {
        grunt.log.writeln(JSON.stringify(grunt.config(), null, 2));
    })
    var target1 = grunt.option("invalidate") || "index";
    grunt.registerTask("kill_cdn", ["invalidate_cloudfront:" + target1])
    grunt.registerTask('dev', ['clean:build',
                               'css',
                               'shell:build',
                              ]);
    grunt.registerTask("pub", ['clean:build',
                               "css",
                               "shell:update",
                               "autoprefixer",
                               "hugo",
                               "cacheBust",
                               "htmlmin",
                               "compress",//minify and compress because overkill is a thing!
                               'push_production',
                               'kill_cdn'
                              ]);
};
