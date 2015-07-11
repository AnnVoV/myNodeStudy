var app = require('koa')();
var Router = require('koa-router');
var router = new Router();
var pre_router = new Router({
  prefix:'/list'
});

pre_router.get('/',function* (next){
  this.body = 'This is list page!';
});

pre_router.get('/:id',function* (next){
  this.body = 'This is list page!id:->'+this.params.id;
});

router.get('/',function* (next){
  if(this.path != '/'){
    return yield next;
  }
  this.body = 'Welcome to homepage!';
});

router.get('/users',function* (){
  this.body = 'Welcome to user page!';
});

router.get('/users/:id',function* (next){
  if(this.path.match(/\/users\/*/) == null){
    return yield next;
  }
  this.body = 'Welcome to user page! param:id->'+this.params.id;
  console.log('id:',this.params.id);
});

router.get('*',function* (){
  this.body = '404 not found';
});

//一定要注意app.use 中间件的顺序
app.use(pre_router.routes());
//注意这里要把中间件放到app.use里面
app.use(router.routes());


app.listen(8089);