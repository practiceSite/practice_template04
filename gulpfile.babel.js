const gulp					= require('gulp'),
	bulkSass					= require('gulp-sass-bulk-import'),
	sass							= require('gulp-sass'),
	browserSync				= require('browser-sync'), //ブラウザシンク
	plumber						= require('gulp-plumber'), //エラー通知
	notify						= require('gulp-notify'), //エラー通知
	imagemin					= require('gulp-imagemin'), //画像圧縮
	imageminPngquant	= require('imagemin-pngquant'), //png画像の圧縮
	pleeease					= require('gulp-pleeease'), //ベンダープレフィックス
	source						= require('vinyl-source-stream'),
	browserify				= require('browserify'),
	babelify					= require('babelify'),
	browserifyShim		= require('browserify-shim'),
	watchify					= require('watchify'),
	useref						= require('gulp-useref'), //ファイル結合
	gulpif						= require('gulp-if'), // if文
	uglify						= require('gulp-uglify'), //js圧縮
	minifyCss					= require('gulp-cssnano'), //css圧縮
	del								= require('del'), //ディレクトリ削除
	runSequence				= require('run-sequence'), //並行処理
	fs								= require('fs'),
	pug								= require('gulp-pug'), //pug
	data							= require('gulp-data'), //json-data
	sourcemaps				= require('gulp-sourcemaps'),
	jQuery						= require('jquery'),
	sassGraph					= require('sass-graph'),
	path							= require('path') //path


	const paths = {
		root: 'dev',
		public: 'public',
	}
	paths.publicImg		= `${path.public}/img`
	paths.rootImg			= `${path.root}/img`
	paths.src					=	`${path.root}/src`
	paths.views				= `${path.src}/views`
	paths.assets			= `${path.src}/assets`
	paths.json				= `${paths.views}/_data`

/*
 * Sass
 */
gulp.task('sass', () => {
	gulp.src(`${paths.assets}/styles/**/*.scss`)
		.pipe(plumber({
			errorHandler: notify.onError('Error: <%= error.message %>')
		}))
		.pipe(sourcemaps.init())
		.pipe(bulkSass())
		.pipe(sass())
		.pipe(pleeease({
			sass: true,
			minifier: true //圧縮の有無 true/false
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(`${paths.root}/css`));
});

gulp.task('watch-sass', function(cb) {
	return watch({
			glob: './dev/src/assets/styles/**/*scss',
			emitOnGlob: false,
			name: 'Sass'
		})
		.pipe(sassGraph(sassLoadPaths))
		.pipe(sass({
			loadPath: sassLoadPaths
		}))
		.pipe(notify('Sass compiled <%= file.relative %>'))
		.pipe(gulp.dest(`${paths.root}/css`));
});

/*
 * JavaScript
 */

gulp.task('browserify', () => {
	const option = {
		bundleOption: {
			cache: {},
			packageCache: {},
			fullPaths: false,
			debug: true,
			entries: `${paths.assets}/js/main.js`,
			extensions: ['js']
		},
		dest: `${paths.root}/js`,
		filename: 'bundle.js'
	};
	const b = browserify(option.bundleOption)
		.transform(babelify.configure({
			compact: false,
			presets: ['es2015']
		}))
		.transform(browserifyShim);
	const bundle = function() {
		b.bundle()
			.pipe(plumber({
				errorHandler: notify.onError('Error: <%= error.message %>')
			}))
			.pipe(source(option.filename))
			.pipe(gulp.dest(option.dest));
	};
	if (global.isWatching) {
		const bundler = watchify(b);
		bundler.on('update', bundle);
	}
	return bundle();
});

/*
 * Pleeease
 */
gulp.task('pleeease', () => {
	return gulp.src(`${paths.root}/css/*.css`)
		.pipe(pleeease({
			sass: true,
			minifier: true //圧縮の有無 true/false
		}))
		.pipe(plumber({
			errorHandler: notify.onError('Error: <%= error.message %>')
		}))
		.pipe(gulp.dest(`{paths.root}/css`));
});

/*
 * Imagemin
 */
gulp.task('imagemin', () => {
	const srcGlob = `${paths.rootDirImg}/**/*.+(jpg|jpeg|png|gif|svg)`;
	const dstGlob = paths.publicImg;
	const imageminOptions = {
		optimizationLevel: 7,
		use: imageminPngquant({
			quality: '65-80',
			speed: 1
		})
	};

	gulp.src(srcGlob)
		.pipe(plumber({
			errorHandler: notify.onError('Error: <%= error.message %>')
		}))
		.pipe(imagemin(imageminOptions))
		.pipe(gulp.dest(paths.publicImg));
});

/*
 * Useref
 */
gulp.task('html', () => {
	return gulp.src(`${paths.root}/**/*.+(html|php)`)
		.pipe(useref({
			searchPath: ['.', 'dev']
		}))
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(gulp.dest(paths.public));
});

/*
 * pug
 */
gulp.task('pug', () => {
	gulp.src([
		`${paths.views}/**/*.pug`,
		`!${paths.views}/**/_*.pug`
	])
		.pipe(plumber({
			errorHandler: notify.onError('Error: <%= error.message %>')
		}))
		.pipe(data(function(file) {
			const locals = JSON.parse(fs.readFileSync(`${paths.json}/site.json`));
			locals.relativePath = path.relative(file.base, file.path.replace(/\.pug$/, '.html'));
			return {
				site: locals
			};
		}))
		.pipe(pug({
			pretty: '\t'
		}, {
			ext: '.html'
		}))
		.pipe(gulp.dest(paths.root));
});


/*
 * Browser-sync
 */
gulp.task('browser-sync', () => {
	browserSync.init({
		server: {
			baseDir: paths.root,
			routes: {
				'/node_modules': 'node_modules'
			}
		},
		// proxy: 'localhost:8888',
		notify: true
	});
});
gulp.task('bs-reload', () => {
	browserSync.reload();
});

gulp.task('setWatch', () => {
	global.isWatching = true;
});


/*
 * Default
 */
gulp.task('default', ['browser-sync'], () => {
	const bsList = [
		`${paths.root}/**/*.html`,
		`${paths.root}/**/*.php`,
		`${paths.root}/js/**/*.js`,
		`${paths.root}/css/*.css`,
	];
	gulp.watch(`${paths.views}/**/*.pug`					, ['pug']);
	gulp.watch(`${paths.views}/**/*.json`					, ['pug']);
	gulp.watch(`${paths.assets}/styles/**/*.scss`	, ['sass']);
	gulp.watch(`${paths.assets}/js/**/*.js`				, ['browserify']);
	gulp.watch(bsList															, ['bs-reload']);
});

/*
 * Build
 */
gulp.task('clean', del.bind(null, [paths.public]));
gulp.task('devcopy', () => {
	return gulp.src([
		`${paths.root}/**/*.*`,
		// `!${paths.root}/css/**`,
		// `!${paths.root}/js/**`,
		`!${paths.views}/**`,
		`!${paths.assets}/**`,
		`!${paths.root}/img/**`,
		`!${paths.root}/**/*.html`,
	], {
		dot: true
	}).pipe(gulp.dest(paths.public));
});
gulp.task('build', ['clean'], function(cb) {
	runSequence('sass', 'browserify', 'pug', ['html', 'imagemin', 'devcopy'], cb);
});
