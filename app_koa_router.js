var app = require('koa')();
var Router = require('koa-router');
var router = new Router();
var pre_router = new Router({
  prefix:'/list'
});
var users = ['ann0','ann1','ann2',
  {
    name:'ann3',getFriends:function* (){
      return [
        'amber',
        'cloud huang',
        'linkey',
        'meimei',
        'daisy'
      ];
    }
  }
];//用户数组

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

router
  .param('user', function *(id, next) {
    console.log(users[id]);
    this.user = users[id];
    if (!this.user) return this.status = 404;
      yield next;
    }
  )
  .get('/users/:user', function *(next) {
    this.body = this.user;
  })
  .get('/users/:userId/friends', function *(next) {
    console.log('xxx:',this.user);
    this.body = yield this.user.getFriends();
  });

router.get('/user',function* (){
  this.body = 'Welcome to user page!';
});

router.get('/user/:id',function* (next){
  if(this.path.match(/\/user\/*/) == null){
    return yield next;
  }
  this.body = 'Welcome to user page! param:id->'+this.params.id;
  console.log('id:',this.params.id);
});

router.get('/:category/:id',function* (next){
  console.log(this.params);
  this.body  = this.params;
});

//定向跳转页面 redirect 方法
//当我们请求/login页面时，会跳转到sign-in页面
router.redirect('/login','sign-in')
  .get('/sign-in',function* (){
      this.body = 'Sign in to login';
  });

router.get('*',function* (){
  this.body = '404 not found';
});

//一定要注意app.use 中间件的顺序
app.use(pre_router.routes());
//注意这里要把中间件放到app.use里面
app.use(router.routes());


app.listen(8089);