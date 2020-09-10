'use strict';

const gulp = require('gulp'),
	plumber = require('gulp-plumber'),
	notify = require('gulp-notify'),
	watch = require('gulp-watch'),
	sass = require('gulp-sass'),
	rigger = require('gulp-rigger'),
	cssmin = require('gulp-cssmin'),
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

const onError = function (err) {
	notify.onError({
		title: "Gulp",
		subtitle: "Failure!",
		message: "Error: <%= error.message %>",
		sound: "Beep"
	})(err);

	this.emit('end');
};

const path = {
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

const markup = function() {
	return gulp.src(path.src.twig)
		.pipe(plumber({errorHandler: onError}))
		.pipe(data(function () {
 			return JSON.parse(fs.readFileSync(path.src.data + 'data.json'));
 		}))
		.pipe(twig())
		.pipe(gulp.dest(path.build.html))
		.pipe(reload({stream: true}));
};

const styles = function() {
	return gulp.src(path.src.style)
		.pipe(plumber({errorHandler: onError}))
		.pipe(sass())
		.pipe(gcmq())
		.pipe(cssmin())
		.pipe(gulp.dest(path.build.css))
		.pipe(reload({stream: true}));
};

const scripts = function() {
	return gulp.src(path.src.js)
		.pipe(plumber({errorHandler: onError}))
		.pipe(rigger())
		.pipe(babel({presets: ['@babel/env']}))
		.pipe(uglify())
		.pipe(gulp.dest(path.build.js))
		.pipe(reload({stream: true}));
};

const svg = function() {
	return gulp.src(path.src.svg)
		.pipe(svgSprite({mode: {stack: {sprite: '../sprite.svg'}}}))
		.pipe(gulp.dest(path.build.svg));
};

const webServer = function() {
	browserSync(config);
};

const watchTask = function() {
	gulp.watch(path.watch.js, scripts);
	gulp.watch(path.watch.style, styles);
	gulp.watch(path.watch.twig, markup);
	gulp.watch(path.watch.svg, svg);

	webServer();
};

const clean = function (cb) {
	rimraf(path.clean, cb);
};

const build = gulp.series(styles, scripts, markup, svg, watchTask);

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