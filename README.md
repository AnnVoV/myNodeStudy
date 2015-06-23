#### 在模块中声明路由  
#### 组织路由处理器的原则：  
（1）给路由处理器用命名函数  
    到目前为止，我们总是在行内写路由处理器的，实际上就是马上在那里定义处理路由的函数。  
    这对于小程序或原型来说没有问题，但是随着网站的变大，这种方式很快就会变得笨重。  
（2）路由组织应该是可扩展的    
    我们应该写一个路由routes.js 文件   

````
  module.exports = function(app){
    app.get('/',function(req,res){
      //具体处理过程省略....
    });

    app.get('/tourPlace/:place',function(req,res,next){
      //具体处理过程省略....
    },view.showDetailView);

    //最后一个处理路由,任何一个url都没有匹配
    app.use(function(req,res){
      //具体处理过程省略....
    });
  };

````  
但是结合第(1)条，我们应该给路由处理器，用命名函数的原则，我们应该把路由处理按照功能进行分类  
所以我们会创建handlers文件夹，并且按照功能进行处理器的划分    
handlers/main.js中放首页处理器、/about处理器，以及所有不属于任何其他逻辑分组的处理器，handlers/vacations.js中放跟度假相关的处理器，以此类推。
接下来修改routes.js以使用它：
````
    var main = require('./handlers/main.js');
    module.exports = function(app){
        app.get('/', main.home); 
        app.get('/about', main.about); 
        //...

    };
    
````  
那么在handlers/main.js 的文件可能是下面这样的  
````
    //主页的路由处理
    var data = require('../data');
    exports.main = function(req,res){
        var touristArr = data.getPlaceList();
        res.locals.minSize = 1;
        res.locals.maxSize = 50;
        res.render('index.html',{placeList:touristArr});
    };
    exports.about = function(req,res){
        var touristList = data.getTouristList();
        res.render('about.html',{tourlist:touristList});
    };
    
````

  
     

