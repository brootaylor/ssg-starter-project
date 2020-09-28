// --------------------------------------------------------
// Dependencies
// --------------------------------------------------------

// Utils...
const gulp = require('gulp'),
	  del = require('del'),
	  log = require('fancy-log'),
	  nunjucksRender = require('gulp-nunjucks-render'),
	  data = require('gulp-data'),
	  newer = require('gulp-newer'),
	  browserSync = require('browser-sync').create(),
	  shell = require('gulp-shell'),
	  fs = require("fs");

// CSS...
const sass = require('gulp-sass'),
	  postcss = require('gulp-postcss'),
	  autoprefixer = require('autoprefixer'),
	  critical = require('critical').stream;

// JS...
const babel = require('gulp-babel'),
	  concat = require('gulp-concat'),
	  uglifyJS = require('gulp-uglify');

// Misc (eg. Images)...
const htmlmin = require('gulp-htmlmin'),
	  imagemin = require('gulp-imagemin');


// --------------------------------------------------------
// Configuration
// --------------------------------------------------------

// Root directories...
const root = {
	src: 'src/',	// Source code 'root'
	dist: 'dist/'	// Distribution code 'root'
};

// Code location paths...
const paths = {
	styles: {
		src: `${root.src}scss/`,
		dist: `${root.dist}assets/css/`
	},
	scripts: {
		src: `${root.src}js/`,
		dist: `${root.dist}assets/js/`,
			vendor: {
				src: `${root.src}js/vendor/`,
				dist: `${root.dist}assets/js/vendor/`
			}
	},
	images: {
		src: `${root.src}assets/images/`,
		dist: `${root.dist}assets/images/`
	},
	html: {
		src: `${root.src}html/`,
		dist: `${root.dist}`
	},
	data: {
		src: `${root.src}data/`
	}
};


// --------------------------------------------------------
// Tasks
// --------------------------------------------------------

// Fire up local server...
const serve = function(cb) {
	browserSync.init({
		server: './dist'
	}, cb);
}

// Clean / delete the 'dist' directory...
const cleanDist = function() {
	return del([
		// [Option A]: Delete the entire 'dist' directory....
		root.dist,

		// [Option B]: Only delete certain directories and/or files...
		// `${root.dist}assets/css/`,
		// `${root.dist}assets/fonts/`,
		// `${root.dist}assets/ico/`,
		// `${root.dist}assets/js/`,
		// `${root.dist}assets/video/`,
		// `${root.dist}utils/`,
		// `${root.dist}uk/`,
		// `${root.dist}es/`,
		// `${root.src}.htaccess`,
		// `${root.src}*.xml`,
		// `${root.src}serviceworker.js`
	])
}

// Getting the data...
const getJsonData = function(file) {
	return JSON.parse(fs.readFileSync(`${paths.data.src}data.json`));
}

// Critical CSS extraction...
const criticalCss = function() {
	return gulp
		.src(`${paths.html.dist}**/*.html`)
		.pipe(critical({
			base: root.dist,
			inline: true,
			width: 1200,
			height: 1300,
			css: [`${paths.styles.dist}styles.css`]
		}))
		.on('error', function(err) {
			log.error(err.message);
		})
		.pipe(gulp.dest(paths.html.dist));
}

// Styles...
const styles = function() {
	return gulp.src(`${paths.styles.src}**/*.scss`)
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([autoprefixer()]))
		.pipe(gulp.dest(paths.styles.dist))
		.pipe(browserSync.stream());
}

// Styles minify...
const stylesMin = function() {
	return gulp.src(`${paths.styles.src}**/*.scss`)
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([autoprefixer()]))
		.pipe(gulp.dest(paths.styles.dist))
		.pipe(browserSync.stream());
}

// Concatenate styles...
const stylesConcat = function() {
	return gulp.src([
		`${paths.styles.dist}styles.css`,
		`${root.src}assets/css/vendor/vendor.css`
	])
		.pipe(concat('styles.css'))
		.pipe(gulp.dest(paths.styles.dist));
}

// Scripts...
const scripts = function() {
	return gulp.src([
		// [Option A]: Grab all script files...
		`${paths.scripts.src}**/*.js`,

		// [Option B]: Declare files seperately to define concatenation order...
		// `${paths.scripts.src}app.js`,
		// `${paths.scripts.src}contentToggle.js`,
		// `${paths.scripts.src}yearDateStamp.js`,
		`!${paths.scripts.vendor.src}**/*.js` // Ignore these vendor script files => Uncomment this if using "Option A"
	], { sourcemaps: true })
		.pipe(babel({
			presets: ['@babel/env']
		}))
		.pipe(concat('scripts.js'))
		.pipe(gulp.dest(paths.scripts.dist));
}

// Scripts minify...
const scriptsMin = function() {
	return gulp.src([
		`${paths.scripts.dist}**/*.js`, // All the custom JS
		`!${paths.scripts.vendor.dist}**/*.js` // Ignore the vendor JS
	], { sourcemaps: true })
		.pipe(uglifyJS())
		.pipe(gulp.dest(paths.scripts.dist));
}

// Copy JS Vendor files...
const scriptsVendor = function() {
	return gulp.src([
		// [Option A]: Grab all vendor script files...
		`${paths.scripts.vendor.src}**/*.js`

		// [Option B]: Declare files seperately to define vendor scripts concatenation order...
		// `${paths.scripts.vendor.src}vendorscriptsA.js`,
		// `${paths.scripts.vendor.src}vendorscriptsC.js`,
		// `${paths.scripts.vendor.src}vendorscriptsB.js`
	])
		// .pipe(concat('vendor.js')) // Uncomment this if you'd like to concatenate your vendor JS files
		.pipe(gulp.dest(paths.scripts.vendor.dist));
}

// Compile Nunjucks templates into HTML...
const html = function() {
	return gulp.src([
		`${paths.html.src}**/*.njk`,
		`!${paths.html.src}partials/**/*.njk`,
	])
		.pipe(data(getJsonData))
		.pipe(nunjucksRender({
			path: [`${paths.html.src}partials`]
		}))
		.pipe(gulp.dest(paths.html.dist));
}

// HTML minify...
const htmlMin = function() {
	return gulp.src(`${paths.html.dist}**/*.html`)
		.pipe(htmlmin({collapseWhitespace: true}))
		.pipe(gulp.dest(paths.html.dist));
}

// Optimise images...
const images = function() {
	return gulp.src(`${paths.images.src}**/*`)
		.pipe(newer(paths.images.dist)) // Making sure that only newer / updated images are outputted
		.pipe(imagemin([
			imagemin.gifsicle({interlaced: true}),
			imagemin.jpegtran({progressive: true}),
			imagemin.optipng({optimizationLevel: 5}),
			imagemin.svgo({
				plugins: [
					{removeViewBox: false},
					{cleanupIDs: false}
				]
			})
		]))
		.pipe(gulp.dest(paths.images.dist));
}

// Copy various files...
const copyMisc = function() {
	return gulp.src([
		`${root.src}assets/ico/*`,
		`${root.src}*.xml`, // All 'xml' files in the root directory - ie. sitemap.xml
		`${root.src}manifest.json`,
		`${root.src}serviceworker.js`, // All service worker files in the root directory
		`${root.src}.htaccess`
	], { base: root.src })
		.pipe(gulp.dest(root.dist));
}

// 'Watch' tasks...
const watch = function() {
	serve(); // Starts up a local server instance
	gulp.watch(paths.data.src, getJsonData); // Watching changes to Data
	gulp.watch(paths.styles.src, styles); // Watching changes to SCSS
	gulp.watch(paths.scripts.src, scripts); // Watching changes to JS
	gulp.watch(paths.images.src, images); // Watching changes to Images
	gulp.watch(paths.html.src, html).on('change', browserSync.reload); // Watching changes to Handlebars templates. Reloads browser once task is done
}

// Task sets...

/*
 * 'build' tasks run in series
 * ...or parallel using `gulp.series` and `gulp.parallel`
 */
const buildSet = gulp.series(
		styles,
		stylesConcat,
		scripts,
		html,
		criticalCss,

		// Parallel tasks...
		gulp.parallel(
			scriptsVendor,
			images,
			copyMisc
		)
);

/*
 * 'publish' tasks run in series
 * ...or parallel using `gulp.series` and `gulp.parallel`
 */
const publishSet = gulp.series(
		cleanDist,
		stylesMin,
		stylesConcat,
		scripts,
		scriptsMin,
		html,
		criticalCss,
		htmlMin,

		// Parallel tasks...
		gulp.parallel(
			scriptsVendor,
			images,
			copyMisc
		)
);

// A 'shell' task placeholder for now...
gulp.task('messageStart', shell.task('echo website is building...'));
gulp.task('messageEnd', shell.task('echo website is finished building.'));

// Compiling the code....
gulp.task('build', gulp.series('messageStart', buildSet, 'messageEnd')); // Full build ('unoptimised')
gulp.task('publish', gulp.series('messageStart', publishSet, 'messageEnd')); // Full build ('optimised' - ie. ready for production)
gulp.task('dev', gulp.series(watch)); // Compiles code while developing
gulp.task('clean', gulp.series(cleanDist)); // Clean / delete 'dist' directory
gulp.task('server', gulp.series(serve)); // Spins up local server
gulp.task('default', gulp.series(buildSet, serve)); // 'Default' gulp task
