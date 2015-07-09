var koa = require('koa'),
    app = koa();

//更多的关于路由的例子
app.use(function* (next){
  if(this.path !== '/'){
    return yield next;
  }
  this.body = 'Hello World';
});

app.use(function* (next){
  if(this.path !== '/404'){
    console.log('enter');
    //注意这里为什么要加上return 
    //因为koa 的调用方式是类似回形针的，先向下走，走到yield 后来又会回溯上来的
    //所以我们如果不加return，执行过yield 后，又会往下走到this.body 的操作部分
    return yield next;
  }
  this.body = 'This Page Not Found';
});

app.use(function* (next){
  if(this.path !== '/500'){
    return yield next;
  }
  this.body = 'Internal Server';
});

app.listen(8089);