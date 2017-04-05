// 引入 gulp及组件
var autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),		//压缩css
  jshint = require('gulp-jshint'),			//js代码校验
  uglify = require('gulp-uglify'),			//压缩JS
  uglyfly = require('gulp-uglyfly'),			//压缩JS
  imagemin = require('gulp-imagemin'),		//压缩图片
  rename = require('gulp-rename'),			//合并js文件
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  del = require('del');
/**
 * gulp的依赖
 */
var gulp = require('gulp');
var fileinclude = require('gulp-file-include');

/**
 * webpack的依赖
 */
var server = require('tiny-lr')();
var port = 35279;
var livereload = require('gulp-livereload');
var browerSync = require('browser-sync');
var reload = browerSync.reload;
var connect = require('gulp-connect');

var webpack = require('webpack');
var glob = require('glob');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var precss = require('precss');
var autoprefixer = require('autoprefixer');
var es3ifyPlugin = require('es3ify-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;

var pathMap = require('./src/pathmap.json');
var srcDir = path.resolve(process.cwd(), 'src/lib');
var jsDir = path.resolve(srcDir, 'js');
var viewDir = path.resolve(srcDir, 'views');
var entriesFiles = glob.sync(jsDir + '/**/*.js', {nodir: true});
var pageFiles = glob.sync('src/views/**/*.html', {nodir: true});
var pageRelativePath = 'src/views/';
var extractScss = new ExtractTextPlugin('style/[name].css');

/**
 * 入口文件函数
 */
var entries = function() {

    var map = {};
    //js目录
    var jsDir = path.resolve(srcDir, 'js');
    //获取目录下所有的js文件
    var entriesFiles = glob.sync(jsDir + '/**/*.js', {nodir: true});

    //遍历所有文件，把文件名与文件路径对应起来，生成入口文件所需要的入口对象
    entriesFiles.forEach(function(v, i) {
        //v 即是入口文件的路径
        var filename = v.substring(v.lastIndexOf('/') + 1, v.lastIndexOf('.'));
        map[filename] = v;
    });
    return map;

}

/**
 * 获取模块的js文件
 */
var getJsModule = function() {
    var map = [];
    var moduleDir = path.resolve(srcDir, 'module')
    map = glob.sync(moduleDir + '/**/*.js', {nodir: true});
    map.forEach(function(v, i) {
        map[i] = path.normalize(v)
    })
    return map;
}

/**
* 获取公共基础css文件
*/
var getBaseCss = function() {
    var map = [];
    var scssBaseDir = path.resolve(srcDir, 'scss/base');
    map = glob.sync(scssBaseDir + '/_base.scss', {nodir: true});
    map.forEach(function(v, i) {
        map[i] = path.normalize(v)
    })
    return map;
}

/**
* 获取业务css文件
*/
var getWutongCss = function() {
    var map = [];
    var scssDir = path.resolve(srcDir, 'scss');
    map = glob.sync(scssDir + '/*.scss', {nodir: true});
    map.forEach(function(v, i) {
        map[i] = path.normalize(v)
    })
    return map;
}

/**
* 配置文件
*/
var config = {
    entry: Object.assign(entries(), {
       vender: ["jquery"],
       common: getJsModule(),
       base: getBaseCss()
    }),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'js/[name].bundle.js',
        chunkFilename: "../dist/js/[name].chunk.js",
        publicPath: 'http://192.168.10.242:9999/dist/'
    },
    module: {
        loaders: [
            {
    			test: /\.html$/,
    			loader: "html?-minimize" //避免压缩html,https://github.com/webpack/html-loader/issues/50
    		 },
            {
    			test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
    			loader: 'file-loader?name=fonts/[name].[ext]'
    		 },
            {
    			test: /\.(png|jpe?g|gif)$/,
    			loader: 'url-loader?limit=8192&name=imgs/[name].[ext]'
    		 },
            {
                test: /\.scss$/i,
                loader:extractScss.extract(['css','postcss', 'sass'])
            }
        ]
    },
    postcss: function() {
        return [precss, autoprefixer]
    },
    plugins: [
        //主要是为了暴露全局jQuery
        new webpack.ProvidePlugin({
           $: 'jquery'
        }),
        new CommonsChunkPlugin({
            //此处一定要先打包 common 即公共模块，再打包第三方，否则会全部打到第三方中去。
            name: ['common', 'vender'],
            minChunks: Infinity
        }),
        extractScss
    ],
    resolve: {
        extensions: ['', '.json', '.js', '.html'],
        alias: {
            "jquery": path.resolve(__dirname, "src/lib/plugins/jquery/jquery.min.js")
        }
    }
}

/**
* 获取模板文件相对的路径
*/
var getPageRealtivePath = function(pageFiles, pageRelativePath) {
    var pageFilesPath = {};
    pageFiles.forEach(function (v, i) {
        var dirname = path.dirname(v);
        var extname = path.extname(v);
        var basename = path.basename(v, extname);
        var pathname = path.normalize(path.join(dirname, basename));
        var pageRelativeNorPath = path.normalize(pageRelativePath);
        if (pathname.startsWith(pageRelativeNorPath)) {
            pathname = pathname.substring(pageRelativeNorPath.length);
        }
        pageFilesPath[pathname] = ['./' + v];
    })
    return pageFilesPath;
}

/**
* 模板产出文件
*/
var createViews = function() {
    var viewsFiles = Object.keys(getPageRealtivePath(pageFiles, pageRelativePath));
    viewsFiles.forEach(function(v, i) {

        //为各个页面引入对应的额js，深层次的文件则需要进行处理
        //比如 account/login.html 则拿login
        var jsPath = v;
        if (jsPath.indexOf('\\') > -1) {
            jsPath = jsPath.substring(jsPath.lastIndexOf('\\') + 1)
        }

        var conf = {
            filename: '../dist/views/' + v + '.html',
            template: './src/views/' + v + '.html',
            chunks: ['vender', 'common', jsPath, 'base'], //为各个页面引入对应的
            chunksSortMode: 'dependency' //根据依赖顺序加载文件，否则会出现加载问题
        }
        config.plugins.push(new HtmlWebpackPlugin(conf));

    })
}



/**
 * 引入公用页面模板，便宜成views文件
 */
gulp.task('fileinclude', function() {
    gulp.src(['src/lib/template/**/*.html', '!src/lib/template/common/**.html', '!src/lib/template/component/**/*.html'])
        .pipe(fileinclude({
            prefix: '@@'
        }))
        .pipe(gulp.dest('src/views'))
})

/**
 * webpack的任务
 */
gulp.task('webpack', function() {
    createViews();
    webpack(config, function(err, stats) {
        // console.log(stats)
    })
})

/**
 * 默认任务
 */
gulp.task('default', function() {
    gulp.start('fileinclude', 'webpack');
});

/**
 * 自动刷新任务
 */
gulp.task('brower-sync', function() {
    browerSync.init({
        files: 'dist',
        proxy: 'http://192.168.10.242:9999'
    })
})

/**
 * 监听任务
 */
gulp.task('watch', ['brower-sync'], function() {

    gulp.watch('./src/lib/**/*.html', ['fileinclude', 'webpack']).on('change', reload)

    gulp.watch('./src/lib/**/*.scss', ['webpack'])

    gulp.watch('./src/lib/**/*.js', ['webpack'])

    gulp.watch('./src/lib/images/', ['webpack'])
})




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
              username: '****', //用户名
              password: '*****',  //密码
              port: 9100, //端口
              dest: '/srv/www/nodeapp/static' //目录结构
          }))
          .on('error', function(err) {
              console.log(err);
          });
  });

// Clean  任务执行前，先清除之前生成的文件
gulp.task('clean', function(cb) {
    del(['dist1/**/*', 'dist1/**/*', 'dist1/**/*'], cb)
});

// Default task  设置默认任务
// gulp.task('default', ['clean','styles', 'scripts', 'images'], function() {
//     gulp.start('styles', 'scripts', 'images');
// });
