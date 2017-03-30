#多页面webpack+gulp项目

---

##要求

该框架要实现以下要求：

~1. 多页面应用，多个对应入口~
~2. 第三方库依赖共同打包~
~3. 公用组件打包~
4. 模块化开发与组件化开发
5. 公用基础模板
~6. 兼容ie8~
~7. 懒加载第三方资源~
8. 预编译css语言
9. 语法校验
10. 图片优化压缩sprite
11. 开发环境与生存环境的切换与发布
12. 静态资源的自动发布
13. 开发过程自动编译与刷新

##注意

因为要实现兼容ie8, 所以webpack的版本要求1.x版本，jQuery要求1.11.X版本（还因为自身modele的实现方式不能使用1.9.x）
