var webpack = require('webpack');
var glob = require('glob');
var path = require('path');
var pathMap = require('./src/pathmap.json');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var srcDir = path.resolve(process.cwd(), 'src');
var jsDir = path.resolve(srcDir, 'js');
var viewDir = path.resolve(srcDir, 'views');
var entriesFiles = glob.sync(jsDir + '/**/*.js', {nodir: true});
var pageFiles = glob.sync('src/views/**/*.html', {nodir: true});
var pageRelativePath = 'src/views/';

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
  * 配置文件
  */
 var config = {
     entry: Object.assign(entries(), {
        common: ["jquery"],
        vender: [path.resolve(__dirname, "src/module/request.js"), path.resolve(__dirname, "src/module/test.js")]
     }),
     output: {
         path: path.resolve(__dirname, 'dist'),
         filename: '[name].bundle.js',
         chunkFilename: "../dist/[name].chunk.js"
     },
     plugins: [
         //主要是为了暴露全局jQuery
         new webpack.ProvidePlugin({
            $: 'jquery'
         }),
         new CommonsChunkPlugin({
             name: ['common', 'vender'],
             minChunks: Infinity
         })
     ],
     resolve: {
         extensions: ['', '.json', '.js', '.html'],
         alias: {
             "jquery": path.resolve(__dirname, "src/plugins/jquery/jquery.min.js"),
             "d3": path.resolve(__dirname, "src/plugins/d3/d3.min.js")
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
              chunks: ['common', 'vender', jsPath], //为各个页面引入对应的
              chunksSortMode: 'dependency'
          }
          config.plugins.push(new HtmlWebpackPlugin(conf))
      })
  }
  createViews();






module.exports = config;
