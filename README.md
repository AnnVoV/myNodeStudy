####Koa框架与Express框架的最大区别  
####Koa 是回形针式调用,遇到yield next会向下执行,然后还会回溯上来  
ps.所以有时候我们条件判断的时候要注意使用return    

####中间件当中的this 表示上下文对象context,代表一次http请求和响应  
context 对象封装了request和response对象，并且提供了一些辅助方法  
每次http请求，都会创建一个新的context对象  
ps.context 对象的很多方法，其实是定义在ctx.request(this.request)和ctx.response(this.response)对象上面的  
ctx.path 和 ctx.method 对应于 ctx.request.path 和 ctx.request.method
