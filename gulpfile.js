// 引入 gulp及组件
var gulp = require('gulp'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),		//压缩css
  jshint = require('gulp-jshint'),			//js代码校验
  uglify = require('gulp-uglify'),			//压缩JS
  uglyfly = require('gulp-uglyfly'),			//压缩JS
  imagemin = require('gulp-imagemin'),		//压缩图片
  rename = require('gulp-rename'),			//合并js文件
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  livereload = require('gulp-livereload'),
  del = require('del');

var fileinclude = require('gulp-file-include');


// Styles
gulp.task('styles', function() {
  return gulp.src('dist/styles/*.css')
    // .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest('dist1/styles'))
    .pipe(notify({ message: 'Styles task complete' }));
});
// Scripts
gulp.task('scripts', function() {
    console.log(343434)
  return gulp.src('dist/**/*.js')
    // .pipe(jshint('.jshintrc'))
    // .pipe(jshint.reporter('default'))
    // .pipe(concat('main.js'))
    // .pipe(rename({ suffix: '.min' }))
    .pipe(uglyfly())
    .pipe(gulp.dest('dist1/'))
    .pipe(notify({ message: 'Scripts task complete' }));
});
// Images
gulp.task('images', function() {
  return gulp.src('dist/images/**/*')
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest('dist1/images'))
    .pipe(notify({ message: 'Images task complete' }));
});

gulp.task('default', ['minifyImg'], function () {
     gulp.src(ROOT_PATH + '/static/**/**')
         .pipe(scp({
             host: '***', //ip
             username: 'webmaster', //用户名
             password: '91WutongWebmaster',  //密码
             port: 9100, //端口
             dest: '/srv/www/nodeapp/static' //目录结构
         }))
         .on('error', function(err) {
             console.log(err);
         });
 });

 gulp.task('fileinclude', function() {
     gulp.src(['src/template/**/*.html', '!src/template/common/**.html'])
        .pipe(fileinclude({
            prefix: '@@'
        }))
        .pipe(gulp.dest('src/views'))
 })

// Clean  任务执行前，先清除之前生成的文件
gulp.task('clean', function(cb) {
    del(['dist1/**/*', 'dist1/**/*', 'dist1/**/*'], cb)
});

// Default task  设置默认任务
gulp.task('default', ['clean','styles', 'scripts', 'images'], function() {
    gulp.start('styles', 'scripts', 'images');
});
