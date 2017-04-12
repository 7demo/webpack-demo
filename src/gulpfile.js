/**
 * gulp的依赖
 */
var gulp = require('gulp');
var fileinclude = require('gulp-file-include');
var browerSync = require('browser-sync');
var reload = browerSync.reload;
var sass = require('gulp-sass');
var gulpautoprefixer = require('gulp-autoprefixer');
var spriter=require('gulp-spriter-inline');
var minifycss = require('gulp-minify-css');
var jshint = require('gulp-jshint');
var scsslint = require('gulp-scss-lint');
var clean = require('gulp-clean');
var scp = require('gulp-scp2');

/**
 * webpack的依赖
 */
var webpack = require('webpack');
var glob = require('glob');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var precss = require('precss');
var autoprefixer = require('autoprefixer');
var es3ifyPlugin = require('es3ify-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var WebpackMd5Hash = require('webpack-md5-hash');

/**
 * 配置
 */
var config = require('./config.js');

/**
 * 此时环境
    分为 development(开发)  production（生产）  deploy（与生产一样，只是增加静态资源部署换节）
    运行时 需要
    gulp watch --env dev/build/deploy
 */
var env = processArgFunc();

/**
 * 获得或者设定目录
 */
//获得webpack的根目录，就是lib
var rootDir = path.resolve(process.cwd(), 'lib');
//js入口目录
var jsDir = path.resolve(rootDir, 'js');
//webpack的页面模板目录，其实经过gulp编译后的位置
var viewDir = path.resolve(rootDir, 'views');
//webpack的入口文件
var entriesFiles = glob.sync(jsDir + '/**/*.js', {nodir: true});
//webpack页面模板文件
var pageFiles = glob.sync('views/**/*.html', {nodir: true});
//因为模板目录是有层级的，必须获取其层级，这个层级是以views为参考
var pageRelativePath = 'views/';
//webpack中抽离css，并编译到style目录中
var extractScss = env === 'dev' ? new ExtractTextPlugin('style/[name].css') : new ExtractTextPlugin('style/[name].[chunkhash:8].css');
var enteryJsPath = env === 'dev' ? 'js/[name].chunk.js' : 'js/[name].[chunkhash:8].js';
var imagePath = env === 'dev' ? 'images/[name].[ext]' : 'images/[name].[hash:8].[ext]';


/**
 * 运行环境处理
 */
function processArgFunc() {

    //gulp deploy -env UAT
    if (process.argv.length === 5 && process.argv[2] === 'deploy') {
        if (process.argv[4] === 'PRO') {
            return 'deploy:PRO';
        } else if (process.argv[4] === 'UAT') {
            return 'deploy:UAT';
        }
    }

    //gulp build -env UAT
    if (process.argv.length === 5 && process.argv[2] === 'build') {
        if (process.argv[4] === 'PRO') {
            return 'build:PRO';
        } else if (process.argv[4] === 'UAT') {
            return 'build:UAT';
        }
    }

    //gulp ** 时候
    if (process.argv.length === 3) {
        //开发环境
        if (process.argv[2] === 'build') {
            return 'build:UAT';
        }

        if (process.argv[2] === 'deploy') {
            return 'deploy:UAT';
        }
    }

    //只运行gulp的时候，就是开发环境
    if (process.argv.length === 2) {
        return 'dev';
    }

    return 'dev';

}

/**
 * 入口文件函数
 */
var entries = function() {

    var map = {};
    //js目录
    var jsDir = path.resolve(rootDir, 'js');
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
    var moduleDir = path.resolve(rootDir, 'module')
    map = glob.sync(moduleDir + '/**/*.js', {nodir: true});
    map.forEach(function(v, i) {
        map[i] = path.normalize(v)
    });
    return map;
}


/**
* 获取scss文件 gulp编译
*/
var getWutongScss = function() {
    var map = [];
    map = glob.sync('lib/scss/**/*.scss', {nodir: true});
    return map;
}

/**
* 获取基础css文件 webpack 使用
*/
var getBaseCss = function() {
    var map = [];
    var scssBaseDir = path.resolve(rootDir, 'css/base');
    map = glob.sync(scssBaseDir + '/base.css', {nodir: true});
    map.forEach(function(v, i) {
        map[i] = path.normalize(v)
    })
    return map;
}


/**
* 配置文件
*/

var webpackConfig = {
    entry: Object.assign(entries(), {
       vender: ["jquery"],
       common: getJsModule(),
       base: getBaseCss()
    }),
    output: {
        path: path.resolve(__dirname, '../' + config[env]['dir']),
        filename: enteryJsPath,
        chunkFilename: '../'+ config[env]['dir'] + '/' + enteryJsPath,
        publicPath: config[env]['staticUrl']
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
    			loader: 'url-loader?limit=8192&name=' + imagePath
    		 },
            {
                test: /\.css$/i,
                loader:extractScss.extract(['css'])
            }
        ]
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
            "jquery": path.resolve(__dirname, "lib/plugins/jquery/jquery.min.js")
        }
    }
}

/**
 * 为了兼容ie8 必须使用webpack进行压缩js
 */
 if (env !== 'env') {
     webpackConfig.plugins.push(new webpack.optimize.UglifyJsPlugin({
         compress: {
            warnings: false,
                screw_ie8 : false
            },
            mangle: {
                screw_ie8: false
            },
            output: {
                screw_ie8: false
            }
    }))
    webpackConfig.plugins.push(new WebpackMd5Hash());
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
            filename: '../'+ config[env]['dir'] +'/views/' + v + '.html',
            template: './views/' + v + '.html',
            chunks: ['vender', 'common', jsPath, 'base'], //为各个页面引入对应的
            chunksSortMode: 'dependency' //根据依赖顺序加载文件，否则会出现加载问题
        }
        webpackConfig.plugins.push(new HtmlWebpackPlugin(conf));

    })
}

/**
 * 引入公用页面模板，便宜成views文件
 */
gulp.task('fileinclude', function() {
    gulp.src(['lib/template/**/*.html', '!lib/template/common/**.html'])
        .pipe(fileinclude({
            prefix: '@@'
        }))
        .pipe(gulp.dest('views'))
})


/**
 * sass编译成对应路径css 自动补充前缀，默认情况下，下划线开始的文件不进行编译处理，全部集成到base.scss中处理。
    每个scss的文件生成一个雪碧图
   进行雪碧图，雪碧图的路径 根据当前scss的目录，自动设定层级
   即地址 把 地址换成对应的 ../  如\\base 换成 ../  而\\base\\home 换成 ../../
 */
gulp.task('sass', function() {

    //获得scss的所有文件，
    var scssFiles = getWutongScss();
    //获得 scss文件相对src/lib/scss的路径
    var scssFilesPath = Object.keys(getPageRealtivePath(scssFiles, 'lib/scss'));
    //每个文件进行编译处理
    scssFilesPath.forEach(function(v, i) {

        //雪碧图的默认路径
        var spritesPath = '../';
        //因为scss的路径标准化处理过，这个地方还原到window下的路径
        var vWindowsPath = v.replace(/\\/g, '/');
        //目录层级，/home 表示一个层级 /home/base 表示两个层级
        var zindexArr = vWindowsPath.match(/\/\w+/g);
        //scss打包后的路径
        var packPath = ''

        //若目录层级大于1， 则取路径 如 /home/base  则路径为 /home；
        //☆☆☆☆☆☆☆☆☆☆☆☆此处也决定，目录只能有两级 ☆☆☆☆☆☆☆☆☆☆☆☆☆☆☆
        if (zindexArr.length > 1) {
            packPath = zindexArr[0]
        } else {
            packPath = '/'
        }

        //为了把 地址换成对应的 ../  如\\base 换成 ../  而\\base\\home 换成 ../../
        if (v.indexOf('\\') > -1) {
            spritesPath = v.replace(/\\\w+/g, '../')
        }
        var spriteNameFix = v.substring(v.lastIndexOf('\\') + 1);

        //根据环境是否压缩css
        if (env === 'development') {
            gulp.src('lib/scss' + vWindowsPath + '.scss')
                .pipe(gulpautoprefixer({
                    browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
                    cascade: false, //是否美化属性值 默认：true 像这样：
                    remove:true //是否去掉不必要的前缀 默认：true
                }))
                .pipe(sass())
                .pipe(spriter({
                    // 生成的spriter的位置
                    'spriteSheet': './lib/images/'+ spriteNameFix +'_sprite.png',
                    'pathToSpriteSheetFromCSS': spritesPath +'images/'+ spriteNameFix +'_sprite.png'
                }))
                .on('error', sass.logError)
                .pipe(gulp.dest('lib/css' + packPath))

        } else {
            gulp.src('lib/scss' + vWindowsPath + '.scss')
                .pipe(gulpautoprefixer({
                    browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
                    cascade: false, //是否美化属性值 默认：true 像这样：
                    remove:true //是否去掉不必要的前缀 默认：true
                }))
                .pipe(sass())
                .pipe(spriter({
                    // 生成的spriter的位置
                    'spriteSheet': './lib/images/'+ spriteNameFix +'_sprite.png',
                    'pathToSpriteSheetFromCSS': spritesPath +'images/'+ spriteNameFix +'_sprite.png'
                }))
                .pipe(minifycss())
                .on('error', sass.logError)
                .pipe(gulp.dest('lib/css' + packPath))
        }

    })

})

/**
 * 检查js语法
 */
gulp.task('jsLint', function () {
    gulp.src('lib/js/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter()); // 输出检查结果
});

/**
 * 检查scss语法
   因为import  路径文件会造成问题 暂时不用
 */
gulp.task('scsslint', function () {
    gulp.src('lib/js/**/*.js')
    .pipe(scsslint());
});

/**
 * webpack的任务
 */
gulp.task('webpack', function() {
    createViews();
    webpack(webpackConfig, function(err, stats) {
    })
})

/**
 * 删除产出目录
 */
gulp.task('clean', function() {
    gulp.src('../' + config[env]['dir'])
    .pipe(clean({
        force: true
    }));
})

/**
 * 发布到服务器
   不同资源要输出到不同的目录
 */
 gulp.task('scpServer',function () {
       gulp.src(['../' + config[env]['dir'] + '/js/**/**'])
           .pipe(scp({
               host: config[env]['host'], //ip
               username: config[env]['username'], //用户名
               password: config[env]['password'],  //密码
               port: config[env]['post'], //端口
               dest: config[env]['destFile'] + 'js' //目录结构
           }))
           .on('error', function(err) {
               console.log(err);
           });
       gulp.src([ '../' + config[env]['dir'] + '/style/**/**'])
           .pipe(scp({
               host: config[env]['host'], //ip
               username: config[env]['username'], //用户名
               password: config[env]['password'],  //密码
               port: config[env]['post'], //端口
               dest: config[env]['destFile'] + 'style' //目录结构
           }))
           .on('error', function(err) {
               console.log(err);
           });
       gulp.src(['../' + config[env]['dir'] + '/images/**/**'])
           .pipe(scp({
               host: config[env]['host'], //ip
               username: config[env]['username'], //用户名
               password: config[env]['password'],  //密码
               port: config[env]['post'], //端口
               dest: config[env]['destFile'] + 'images' //目录结构
           }))
           .on('error', function(err) {
               console.log(err);
           });
  })
/**
 * 默认任务
 */
gulp.task('default', function() {
    console.log(process.argv);
    // gulp.start('fileinclude', 'sass', 'webpack');
});

/**
 * 自动刷新任务
 */
gulp.task('brower-sync', function() {
    browerSync.init({
        files: '../' + config[env]['dir'],
        proxy: config[env]['proxyUrl']
    })
})

/**
 * 监听编译
 */
gulp.task('package', function() {

    gulp.watch('./lib/**/*.html', ['fileinclude', 'webpack'])

    gulp.watch('./lib/**/*.scss', ['sass', 'webpack'])

    gulp.watch('./lib/**/*.js', ['webpack'])

    gulp.watch('./lib/images/', ['webpack'])

})
/**
 * 监听刷新
 */
gulp.task('watch', ['package', 'brower-sync'], function() {
    gulp.watch('../' + config[env]['dir']).on('change', reload);
})

/**
 * 编译任务
 */
 gulp.task('build', ['clean', 'jsLint'], function() {
     gulp.start('fileinclude', 'sass', 'sass', 'webpack'); //因为scss编译的问题 需要执行两次scss
 });

 /**
  * 发布任务
  */
  gulp.task('deploy', function() {
      console.log(config[env])
      gulp.start('scpServer');
  });
