'use strict';

const gulp = require('gulp'),
	path = require('path'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	watch = require('gulp-watch'),
	sass = require('gulp-sass'),
	rigger = require('gulp-rigger'),
	gulpif = require('gulp-if'),
	cssmin = require('gulp-cssmin'),
	sourcemaps = require('gulp-sourcemaps'),
	gcmq = require('gulp-group-css-media-queries'),
	data = require('gulp-data'),
	twig = require('gulp-twig'),
	uglify = require('gulp-uglify-es').default,
	babel = require('gulp-babel'),
	rimraf = require('rimraf'),
	svgSprite = require('gulp-svg-sprite'),
	browserSync = require("browser-sync"),
	fs = require('file-system'),
	reload = browserSync.reload;

const fractal = require('@frctl/fractal').create()

const onError = function (err) {
	notify.onError({
		title: "Gulp",
		subtitle: "Failure!",
		message: "Error: <%= error.message %>",
		sound: "Beep"
	})(err);

	this.emit('end');
};

const pathes = {
	build: {
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		svg: 'build/assets/icons',
	},
	src: {
		twig: 'src/*.twig',
		js: 'src/js/main.js',
		style: 'src/style/main.scss',
		svg: 'src/svg/*.svg',
		data: 'src/'
	},
	watch: {
		twig: 'src/**/*.twig',
		js: 'src/js/**/*.js',
		style: 'src/style/**/*.scss',
		svg: 'src/svg/*.svg',
		data: 'src/*.json'
	},
	clean: './build'
};

const config = {
	server: {
		baseDir: "./build"
	},
	host: 'localhost',
	port: 9000,
	logPrefix: "Frontend"
};

fractal.components.set('path', `${__dirname}/src/components`);
fractal.components.engine(require('@frctl/twig'));
fractal.components.set('ext', '.twig');
fractal.docs.set('path', path.join(__dirname, 'docs'));
fractal.docs.engine(require('@frctl/twig'));
fractal.web.set('static.path', path.join(__dirname, 'build'));
fractal.web.set('static.mount', 'build');
fractal.web.set('builder.dest', `${__dirname}/styleguide`);

const logger = fractal.cli.console;

const frctlStart = function() {
	const server = fractal.web.server({
		sync: true
	});
	server.on('error', err => logger.error(err.message));
	return server.start().then(() => {
		logger.success(`Fractal server is now running at ${server.url}`);
	});
};

const frctlBuld = function() {
	const builder = fractal.web.builder();
	builder.on('progress', (completed, total) => logger.update(`Exported ${completed} of ${total} items`, 'info'));
	builder.on('error', err => logger.error(err.message));
	return builder.build().then(() => {
		logger.success('Fractal build completed!');
	});
};

const markup = function() {
	return gulp.src(pathes.src.twig)
		.pipe(plumber({errorHandler: onError}))
		.pipe(data(function () {
 			return JSON.parse(fs.readFileSync(pathes.src.data + 'data.json'));
 		}))
		.pipe(twig())
		.pipe(gulp.dest(pathes.build.html))
		.pipe(reload({stream: true}));
};

const styles = function() {
	return gulp.src(pathes.src.style)
		.pipe(plumber({errorHandler: onError}))
		.pipe(gulpif(!productionMode,sourcemaps.init()))
		.pipe(sass())
		.pipe(gcmq())
		.pipe(gulpif(productionMode, cssmin()))
		.pipe(gulpif(!productionMode,sourcemaps.write()))
		.pipe(gulp.dest(pathes.build.css))
		.pipe(reload({stream: true}));
};

const scripts = function() {
	return gulp.src(pathes.src.js)
		.pipe(plumber({errorHandler: onError}))
		.pipe(rigger())
		.pipe(gulpif(!productionMode,sourcemaps.init()))
		.pipe(babel({presets: ['@babel/env']}))
		.pipe(gulpif(productionMode, uglify()))
		.pipe(gulpif(!productionMode,sourcemaps.write()))
		.pipe(gulp.dest(pathes.build.js))
		.pipe(reload({stream: true}));
};

const svg = function() {
	return gulp.src(pathes.src.svg)
		.pipe(svgSprite({mode: {stack: {sprite: '../sprite.svg'}}}))
		.pipe(gulp.dest(pathes.build.svg));
};

const webServer = function() {
	browserSync(config);
};

const watchTask = function() {
	gulp.watch(pathes.watch.js, scripts);
	gulp.watch(pathes.watch.style, styles);
	gulp.watch(pathes.watch.twig, markup);
	gulp.watch(pathes.watch.svg, svg);
	gulp.watch(pathes.watch.data, markup);

	webServer();
};

const clean = function (cb) {
	rimraf(pathes.clean, cb);
};

const prodMode = function (cb) {
	productionMode = true;
	cb();
};

let productionMode = false;

const build = gulp.series(styles, scripts, markup, svg, frctlStart, watchTask);
const prod = gulp.series(prodMode, styles, scripts, markup, svg, frctlBuld);


exports.frctlStart = frctlStart;
exports.frctlBuld = frctlBuld;
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.watch = watch;
exports.svg = svg;
exports.build = build;

/*
 * Define default task that can be called by just running `gulp` from cli
 */

exports.default = build;
exports.production = prod;