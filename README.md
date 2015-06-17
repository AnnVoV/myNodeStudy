#### cookie 与 Session 的学习  
[文章参考链接](http://www.ituring.com.cn/tupubarticle/3530)  

关于中间件要注意的几点：  
（1）路由处理器中间件的参数中都有回调函数，但回调函数也可以省略，这个函数可以有2个、3个或者4个参数  
         如果有2个或者3个参数，头2个参数是req 和 res, 第3个是 next 函数  
         如果有4个参数，它就变成了错误处理中间件，第一个参数变成了错误对象，然后依次是请求、响应和next对象  

（2）如果不调用next( ) 管道就会被终止，也不会再有处理器或者中间件做后续的处理。  
  如果你不调用next( ),则应该发送一个响应到客户端比如：res.send ，res.json  res.render 等，如果你不这样做，客户端会被挂起，并且最终导致超时。  

（3）如果调用了next( ),一般不宜再发送响应到客户端。如果你发送了，管道中后续的中间件或者路由处理器还会执行，但是他们发送的任何响应都是会被忽略的。  
     

