const gulp = require("gulp");
const plumber = require("gulp-plumber");
const sourcemap = require("gulp-sourcemaps");
const sass = require('gulp-sass')(require('sass'));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const rename = require("gulp-rename");
const terser = require("gulp-terser");
const squoosh = require("gulp-libsquoosh");
const webp = require("gulp-webp");
const svgmin = require("gulp-svgmin");
const svgSprite = require("gulp-svg-sprite");
const del = require("del");
const sync = require("browser-sync").create();
const nunjucks = require("gulp-nunjucks-templates");

const data = require('gulp-data');
const fs = require('fs');



const paths = {
  src: "src",
  dest: "dest",
  watch: "src",
  server: "dest",
  port: "8008",
};

// Styles

const styles = () => {
  return gulp.src( `${paths.src}/sass/*.scss`)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      csso()
    ]))
    // .pipe(rename("style.min.css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest(`${paths.dest}/css`))
    .pipe(sync.stream());
}

exports.styles = styles;

// HTML

const html = () => {
  return gulp.src( `${paths.src}/*.html`)
    .pipe(data(function(file) {
      return JSON.parse(fs.readFileSync('./src/data/data.json'));
    }))
    .pipe(nunjucks({
      path: ["src/layouts", "src/includes"],
      ext: ".html",
    }))
    .pipe(gulp.dest(paths.dest));
}

exports.html = html;

// Scripts

const scripts = () => {
  return gulp.src( `${paths.src}/js/*.js`, {"allowEmpty": true})
    .pipe(terser())
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(gulp.dest(`${paths.dest}/js`))
    .pipe(sync.stream());
}

exports.scripts = scripts;

//

const optimizeRastr = () => {
  return gulp.src( `${paths.src}/img/**/*.{png,jpg}`, {"allowEmpty": true})
    .pipe(squoosh())
    .pipe(gulp.dest(`${paths.dest}/img`))
}

exports.optimizeRastr = optimizeRastr;

const optimizeSvg = () => {
  return gulp.src( `${paths.src}/img/**/*.svg`, {"allowEmpty": true})
    .pipe(svgmin())
    .pipe(gulp.dest(`${paths.dest}/img`))
}

exports.optimizeSvg = optimizeSvg;

// exports.optimizeImages = optimizeImages;

const copyImages = () => {
  return gulp.src( `${paths.src}/img/**/*.{png,jpg,svg}`, {"allowEmpty": true})
    .pipe(gulp.dest(`${paths.dest}/img`))
}

exports.copyImages = copyImages;

// WebP

const createWebp = () => {
  return gulp.src( `${paths.src}/img/**/*.{jpg,png}`, {"allowEmpty": true})
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest(`${paths.dest}/img`))
}

exports.createWebp = createWebp;

// Sprite
const sprite = () => {
  return gulp.src(`${paths.src}/sprites/*.svg`)
    .pipe(svgmin())
    .pipe(svgSprite({
        mode: {stack: true}
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest(`${paths.dest}/img`));
};
exports.sprite = sprite;

// Copy

const copy = (done) => {
  gulp.src([
    `${paths.src}/fonts/*.{woff2,woff}`,
    `${paths.src}/*.ico`,
    `${paths.src}/img/**/*.svg`,
    `!${paths.src}/img/icons/*.svg`,
  ], {
    base: "source"
  })
    .pipe(gulp.dest(paths.dest))
  done();
}

exports.copy = copy;

// Clean

const clean = () => {
  return del(paths.dest);
};

// Server

const server = (done) => {
  sync.init({
    server: {
      baseDir: paths.dest
    },
    cors: true,
    notify: false,
    ui: false,
  });
  done();
}

exports.server = server;

// Reload

const reload = (done) => {
  sync.reload();
  done();
}

// Watcher

const watcher = () => {
  gulp.watch(`${paths.watch}/sass/**/*.scss`, gulp.series(styles));
  gulp.watch(`${paths.watch}/js/script.js`, gulp.series(scripts));
  gulp.watch(`${paths.watch}/**/*.html`, gulp.series(html, reload));
  gulp.watch(`${paths.watch}/images/**/*.**`, gulp.series(copyImages, reload));
}

const optimizeImages = gulp.parallel(optimizeSvg, optimizeRastr);
exports.optimizeImages = optimizeImages;


// Build

const build = gulp.series(
  clean,
  copy,
  optimizeImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    createWebp
  ),
);

exports.build = build;

// Default


exports.default = gulp.series(
  clean,
  copy,
  copyImages,
  gulp.parallel(
    styles,
    html,
    scripts,
    sprite,
    // createWebp
  ),
  gulp.series(
    server,
    watcher
  ));
