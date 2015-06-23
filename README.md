#### 在模块中声明路由  
#### 组织路由的第一步是把它们都放到它们自己的模块中。一般有两种方式：  
diyizhong  
````
  var routes = require('./routes.js')();
  //引入路由模块
  routes.forEach(function(route){
    app[route.method](route.handler);
    //相关的路由处理
  });
  //但是这种我不太会使用
````

  
     

