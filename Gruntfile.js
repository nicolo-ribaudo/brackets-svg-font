/*jslint node: true */

var archiver = require("archiver"),
    fs       = require("fs"),
    path     = require("path");

module.exports = function (grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    var babelJsOptions = {
        modules: "amd",
        resolveModuleSource: function (source, filepath) {
            var parts = source.match(/([a-z0-9]+!)?([a-z0-9\-\/\.]+)/i);

            return (parts[1] || "") + path.relative("src", path.normalize(filepath.replace(/\/[a-z0-9\-\.]+$/i, "/" + parts[2]))).split(path.sep).join("/");
        }
    };

    function files(sources) {
        return sources.map(function (src) {
            return {
                expand: true,
                cwd: "src/",
                src: src,
                dest: "dist/"
            };
        });
    }

    function changePathPrefix(from, to, file) {
        return path.join(to, path.relative(from, file));
    }

    grunt.initConfig({
        autoprefixer: {
            dist: {
                files: {
                    "dist/style/main.css": "dist/style/main.css"
                }
            }
        },
        babel: {
            options: {
                sourceMap: true
            },
            js: {
                options: babelJsOptions,
                files: files([ "main.js", "modules/*.js" ])
            },
            node: {
                files: files([ "node/*.js" ])
            },
            changed: {}
        },
        clean: {
            all: [ "dist/", "maps/", ".sass-cache/" ],
            sourcemaps: [ "dist/**/*.js.map" ],
            changed: []
        },
        copy: {
            ff: {
                files: files([ "node/fontforge/*.ff" ])
            },
            polyfills: {
                files: files([ "polyfills/**" ])
            }
        },
        htmlmin: {
            options: {
                removeComments: true,
                collapseWhitespace: true
            },
            dist: {
                files: files([ "html/*.html" ])
            },
            changed: {}
        },
        jshint: {
            options: {
                jshintrc: true
            },
            all: [ "src/main.js", "src/modules/*.js", "src/node/*.js", "main.js", "Gruntfile.js" ],
            gruntfile: [ "Gruntfile.js" ],
            src: [ "src/main.js", "src/modules/*.js", "src/node/*.js" ],
            changed: {}
        },
        sass: {
            dist: {
                files: {
                    "dist/style/main.css": "src/style/main.scss"
                }
            }
        },
        uglify: {
            options: {
                sourceMap: true,
                sourceMapName: function (dest) {
                    return changePathPrefix("dist", "maps", dest).replace(/js$/i, "map");
                },
                sourceMapIn: function (src) {
                    return src + ".map";
                },
                sourceMapRoot: ".."
            },
            dist: {
                files: files([ "*.js", "modules/*.js", "node/*.js" ]).map(function (source) {
                    source.cwd = "dist/";
                    return source;
                })
            },
            changed: {}
        },
        watch: {
            options: {
                spawn: false
            },
            js: {
                files: [ "src/main.js", "src/modules/*.js", "src/node/*.js", "src/polyfills/**", "src/node/fontforge/*.ff" ],
            },
            html: {
                files: [ "src/html/**" ]
            },
            css: {
                files: [ "src/style/main.scss" ]
            },
            gruntfile: {
                files: "Gruntfile.js",
                tasks: [ "jshint:gruntfile" ]
            }
        }
    });

    grunt.registerTask("build", function () {
        var done = this.async(),
            Zip = archiver("zip"),
            pkg = grunt.file.readJSON("package.json"),
            zipName = "release/" + pkg.name + ".v" + pkg.version + ".zip",
            output;

        grunt.file.mkdir("release");
        output = fs.createWriteStream(zipName);

        output.on("close", function () {
            grunt.log.ok(zipName + " created. (" + Zip.pointer().toString().replace(/^(\d+)(\d{3})$/, "$1 k") + "B)");
            done();
        });
        Zip.pipe(output);

        // Remove npm-only properties from package.json
        delete pkg.repository;
        delete pkg.devDependencies;

        Zip.directory("dist", false);
        Zip.append(JSON.stringify(pkg), { name: "package.json" });
        Zip.file("LICENSE.md");
        Zip.finalize();
    });

    grunt.registerTask("compile:css", [ "sass:dist", "autoprefixer:dist" ]);
    grunt.registerTask("compile:js", [ "jshint:src", "babel:js", "babel:node", "uglify:dist", "copy:polyfills", "clean:sourcemaps" ]);

    grunt.registerTask("init", [ "compile:js", "copy:ff", "htmlmin:dist", "compile:css" ]);

    grunt.event.on("watch", function (action, filepath, target) {
        // Reset grunt options
        [ "babel", "clean", "copy", "jshint", "uglify" ].forEach(function (task) {
            grunt.config(task + ".changed", {});
        });

        var distPath = changePathPrefix("src", "dist", filepath);

        if (target === "js") {
            if (action === "delete") {
                grunt.config("clean.changed.src", [ distPath, changePathPrefix("src", "maps", filepath) ]);

                grunt.task.run("clean:changed");
            } else if (grunt.file.doesPathContain("src/node/fontforge/", filepath)) {
                grunt.task.run("copy:ff");
            } else if (grunt.file.doesPathContain("src/polyfills/", filepath)) {
                grunt.task.run("copy:polyfills");
            } else {
                grunt.config("jshint.changed.src", filepath);
                grunt.config("babel.changed.src", filepath);
                grunt.config("babel.changed.dest", distPath);
                grunt.config("uglify.changed.src", distPath);
                grunt.config("uglify.changed.dest", distPath);
                grunt.config("clean.changed.src", changePathPrefix("src", "maps", filepath));

                if (!grunt.file.doesPathContain("src/node/", filepath)) {
                    grunt.config("babel.changed.options", babelJsOptions);
                }

                grunt.task.run([ "jshint:changed", "babel:changed", "uglify:changed", "clean:changed", "clean:sourcemaps" ]);
            }
        } else if (target === "html") {
            if (action === "delete") {
                grunt.config("clean.changed.src", distPath);

                grunt.task.run("clean:changed");
            } else {
                grunt.config("htmlmin.changed.src", filepath);
                grunt.config("htmlmin.changed.dest", changePathPrefix("src", "dist", filepath));

                grunt.task.run("htmlmin:changed");
            }
        } else if (target === "css") {
            if (action === "delete") {
                grunt.config("clean.changed.src", distPath);

                grunt.task.run("clean:changed");
            } else {
                grunt.task.run("compile:css");
            }
        }
    });
};