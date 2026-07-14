const {series, parallel, watch, src, dest} = require('gulp');
const pump = require('pump');
const fs = require('fs');
const path = require('path');
const order = require('ordered-read-streams');

// gulp plugins and utils
const livereload = require('gulp-livereload');
const postcss = require('gulp-postcss');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const beeper = require('beeper');
const zip = require('gulp-zip');

// postcss plugins
const easyimport = require('postcss-easy-import');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

// translations support
const { mergeLocales } = require('@tryghost/theme-translations/build');
const sharedThemeAssetsPath = path.dirname(require.resolve('@tryghost/shared-theme-assets/package.json'));

function serve(done) {
    livereload.listen();
    done();
}

function handleError(done) {
    return function (err) {
        if (err) {
            beeper();
        }
        return done(err);
    };
};

function hbs(done) {
    pump([
        src(['*.hbs', 'partials/**/*.hbs']),
        livereload()
    ], handleError(done));
}

function css(done) {
    pump([
        src('assets/css/screen.css', {sourcemaps: true}),
        postcss([
            easyimport,
            autoprefixer(),
            cssnano()
        ]),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function getJsFiles(version) {
    const jsFiles = [
        src(`${sharedThemeAssetsPath}/assets/js/${version}/lib/**/*.js`),
        src(`${sharedThemeAssetsPath}/assets/js/${version}/main.js`),
    ];

    if (fs.existsSync(`assets/js/lib`)) {
        jsFiles.push(src(`assets/js/lib/*.js`));
    }

    jsFiles.push(src(`assets/js/main.js`));

    return jsFiles;
}

function js(done) {
    pump([
        order(getJsFiles('v1'), {sourcemaps: true}),
        concat('main.min.js'),
        uglify(),
        dest('assets/built/', {sourcemaps: '.'}),
        livereload()
    ], handleError(done));
}

function dataLoader(done) {
  pump(
    [
      src("assets/js/data-loader.js", { sourcemaps: true }),
      concat("data-loader.min.js"),
      uglify(),
      dest("assets/built/", { sourcemaps: "." }),
      livereload(),
    ],
    handleError(done)
  );
}

function dataCopy(done) {
  // Use mock @publicledger/data package for development
  // In production, this will come from the real NPM package
  const mockPackagePath = "test/mocks/publicledger-data/data";
  const dataSource = fs.existsSync(mockPackagePath)
    ? `${mockPackagePath}/**/*.json`
    : "data/**/*.json"; // Fallback if real package is installed

  pump([src(dataSource, { encoding: false }), dest("assets/built/data/")], handleError(done));
}

function zipper(done) {
    const filename = require('./package.json').name + '.zip';

    pump(
      [
        src(
          [
            "**",
            "!node_modules",
            "!node_modules/**",
            "!dist",
            "!dist/**",
            "!pnpm-debug.log",
            "!pnpm-lock.yaml",
            "!pnpm-workspace.yaml",
            "!AGENTS.md",
            "!CLAUDE.md",
            "!docs-local",
            "!docs-local/**",
            "!test",
            "!test/**",
            "!data",
            "!data/**",
            // Explicitly include built assets (in .gitignore but needed in package)
            "assets/built/**",
          ],
          { encoding: false, dot: true }
        ),
        zip(filename),
        dest("dist/"),
      ],
      handleError(done)
    );
}

function locales(done) {
    mergeLocales({
        local: './locales-local',
        output: './locales'
    })(done);
}

const localesWatcher = () => watch('./locales-local/**/*.json', locales);
const hbsWatcher = () => watch(['*.hbs', 'partials/**/*.hbs'], hbs);
const cssWatcher = () => watch('assets/css/**/*.css', css);
const jsWatcher = () => watch('assets/js/**/*.js', js);
const dataLoaderWatcher = () => watch("assets/js/data-loader.js", dataLoader);
const dataWatcher = () => watch("test/mocks/publicledger-data/data/**/*.json", dataCopy);
const watcher = parallel(
  hbsWatcher,
  cssWatcher,
  jsWatcher,
  dataLoaderWatcher,
  dataWatcher,
  localesWatcher
);
const build = series(css, js, dataLoader, dataCopy, locales);

exports.build = build;
exports.zip = series(build, zipper);
exports.default = series(build, serve, watcher);
