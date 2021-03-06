/*jshint node: true */

var del      = require("del"),
    fs       = require("fs"),
    gulp     = require("gulp"),
    lazypipe = require("lazypipe"),
    merge    = require("merge2"),
    named    = require("vinyl-named"),
    path     = require("path"),
    semver   = require("semver"),
    $        = require("gulp-load-plugins")();

var jsHintTask = lazypipe()
    .pipe($.jshint)
    .pipe($.jshint.reporter, "jshint-stylish")
    .pipe($.jshint.reporter, "fail");

var changed = lazypipe()
    .pipe(function () {
        return $.if(!("all" in $.util.env), $.changed("./dist"));
    });

function adjustAMDPaths(required, from) {
    if (/^babel-runtime/.test(required)) {
        required = "thirdparty/" + required;
        if (!fs.existsSync(path.join("./src", required + ".js"))) {
            required += "/index";
        }
    }
    return required;
}

gulp.task("build", [ "compile" ], function () {
    var pkg = require("./package.json"),
        zipName = pkg.name + ".v" + pkg.version + ".zip";

    // Remove npm-only properties from package.json
    var pkgStream = gulp.src("./package.json")
        .pipe($.change(function (content) {
            var pkg = JSON.parse(content);

            delete pkg.repository;
            delete pkg.devDependencies;

            return JSON.stringify(pkg);
        }));

    // Remove source maps urls from JavaScript files
    var jsStream = gulp.src("./dist/**/*.js")
        .pipe($.change(function (content) {
            return content.replace(/\n\/\/# sourceMappingURL=[\.\/a-zA-Z]+/, "");
        }));

    return merge(pkgStream, jsStream, gulp.src([ "./dist/**/!(*.js)", "./LICENSE.md" ]))
        .pipe($.zip(zipName))
        .pipe(gulp.dest("./release"));
});

gulp.task("bump", function () {

    var pkg = require("./package.json"),
        type = ("major" in $.util.env) ? "major" : ("minor" in $.util.env) ? "minor" : "patch",
        pre,
        version = {
            old: pkg.version
        };

    if ($.util.env.hasOwnProperty("pre")) {
        type = "pre" + type;
        pre = $.util.env.pre || "beta";
    }

    version.new = semver.inc(version.old, type, pre);

    // Bumping package.version
    var packageVersion = gulp.src("./package.json")
        .pipe($.change(function (content) {
            var pkg = JSON.parse(content);
            pkg.version = version.new;
            return JSON.stringify(pkg, null, 2);
        }))
        .pipe(gulp.dest("./"));

    // Bumping version in CHANGELOG.md
    var changelogVersion = gulp.src("./CHANGELOG.md")
        .pipe($.change(function (changelog) {
            var today = new Date(),
                year = ("0000" + today.getFullYear()).slice(-4),
                month = ("00" + (today.getMonth() + 1)).slice(-2),
                day = ("00" + today.getDate()).slice(-2);
            return changelog.replace("\n## Unreleased", "\n## " + version.new + " - " + year + "-" + month + "-" + day);
        }))
        .pipe(gulp.dest("./"));

    $.util.log("Bumping version from", $.util.colors.green(version.old), "to", $.util.colors.green(version.new));

    return merge(packageVersion, changelogVersion)
        .pipe($.git.commit("Bumping version to " + version.new + ".", { quiet: true }));
});

gulp.task("compile", [ "js.compile", "css", "html" ]);

gulp.task("css", function () {
    return gulp.src("./src/style/main.scss")
        .pipe($.sass({ outputStyle: "compressed" }))
        .pipe($.autoprefixer({ browsers: [ "Chrome >= 29" ] }))
        .pipe(gulp.dest("./dist/style/"));
});

gulp.task("html", function () {
    return gulp.src("./src/html/*.html")
        .pipe($.htmlmin({ removeComments: true, collapseWhitespace: true }))
        .pipe(gulp.dest("./dist/html/"));
});

gulp.task("js.lint", function () {
    return gulp.src("./src/!(thirdparty)**/*.js")
        .pipe(jsHintTask());
});

gulp.task("js.lint.all", [ "js.lint" ], function () {
    return gulp.src([ "./main.js", "./gulpfile.js" ])
        .pipe(jsHintTask());
});

gulp.task("js.compile", [ "js.lint" ], function () {
    
    var compileEnd = lazypipe()
        .pipe($.uglify)
        .pipe($.sourcemaps.write, "../maps", { includeContent: false, sourceRoot: "../src" })
        .pipe(gulp.dest, "./dist");

    var jsCompile = gulp.src([ "./src/main.js", "./src/modules/*.js", "./src/polyfills/*.js" ], { base: "./src" })
        .pipe(changed())
        .pipe($.sourcemaps.init())
        .pipe($.babel({ modules: "amd", resolveModuleSource: adjustAMDPaths, optional: [ "runtime" ] }))
        .pipe(compileEnd());
    
    var thirdpartyCompile = gulp.src([
        "./src/thirdparty/babel-runtime/core-js.js",
        "./src/thirdparty/babel-runtime/core-js/**/*.js",
        "./src/thirdparty/babel-runtime/helpers/**/*.js",
        "./src/thirdparty/babel-runtime/regenerator/**/*.js"
    ], { base: "./src" })
        .pipe(changed())
        .pipe(named(function (file) {
            var filename = path.join(path.dirname(file.path), path.basename(file.path, ".js"));
            return path.relative(path.join(__dirname, "src"), filename);
        }))
        .pipe($.webpack({
            output: {
                libraryTarget: "amd"
            },
            resolve: {
                root: [ path.join(__dirname, "src/thirdparty") ]
            },
            cache: false
        }))
        //.pipe($.uglify())
        .pipe(gulp.dest("./dist"));

    var nodeCompile = gulp.src("./src/node/*.js", { base: "./src" })
        .pipe(changed())
        .pipe($.sourcemaps.init())
        .pipe($.babel())
        .pipe(compileEnd());

    var ffCopy = gulp.src("./src/node/fontforge/*.ff")
        .pipe(gulp.dest("./dist/node/fontforge/"));

    return merge(jsCompile, thirdpartyCompile, nodeCompile, ffCopy);

});

gulp.task("reset", function (cb) {
    del([ "maps/", "dist/" ], cb);
});

gulp.task("watch", function (cb) {
    gulp.watch("./src/style/main.scss", [ "css" ]);

    gulp.watch("./src/html/*.html", [ "html" ]);

    gulp.watch([ "./src/**/*.js", "./src/node/fontforge/*.ff" ], [ "js.compile" ]);

    $.util.log(
        "Watching:",
        "\n  -", $.util.colors.magenta("src/style/main.scss"),
        "\n  -", $.util.colors.magenta("src/html/*.html"),
        "\n  -", $.util.colors.magenta("src/**/*.js"), "and", $.util.colors.magenta("src/node/fontforge/*.ff")
    );
});