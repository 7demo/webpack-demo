var webpack = require('webpack');
var glob = require('glob');
var path = require('path');
var pathMap = require('./src/pathmap.json');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var es3ifyPlugin = require('es3ify-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var srcDir = path.resolve(process.cwd(), 'src');
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
        base: getBaseCss(),
        wutong: getWutongCss()
     }),
     output: {
         path: path.resolve(__dirname, 'dist'),
         filename: '[name].bundle.js',
         chunkFilename: "../dist/[name].chunk.js",
         publicPath: '/dist/'
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
                 loader:extractScss.extract(['css','sass'])
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
             "jquery": path.resolve(__dirname, "src/plugins/jquery/jquery.min.js")
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
              filename: '../views/' + v + '.html',
              template: './src/views/' + v + '.html',
              chunks: ['vender', 'common', jsPath, 'base', 'wutong'], //为各个页面引入对应的
              chunksSortMode: 'dependency' //根据依赖顺序加载文件，否则会出现加载问题
          }
          config.plugins.push(new HtmlWebpackPlugin(conf));

      })
  }
  createViews();




module.exports = config;
