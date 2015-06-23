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

  
     

