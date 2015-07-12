####xtpl与koa框架的结合使用   
[xtpl的相关参考文章:](https://www.npmjs.com/package/xtpl)
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
####使用koa-bodyparser模块