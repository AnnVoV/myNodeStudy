####xtpl与koa框架的结合使用   
[xtpl的相关参考文章:](https://www.npmjs.com/package/xtpl)  
[koa 的可以参考文章:](http://www.atatech.org/articles/30923)
####index.js  
````
  var app = require('./lib/koa')(require('koa')(),{
    views:'./views'
  });

  app.use(function*(){
      yield this.render('index',{data:1});
  });

  app.listen(8089);

````
####使用koa-bodyparser模块 处理与post相关数据的内容  
[koa的body-parser模块](https://github.com/koajs/body-parser)  

####要注意yield 的使用

