var app = require('./lib/koa')(require('koa')(),{
    views:'./views'
}),
    router = require('koa-router')(),
    //使用koa-bodyparser 组件处理post来的数据
    bodyParser = require('koa-bodyparser');

var global = {};

router.get('/',function* (){
  yield this.render('login',{});
});
//上述代码等价于
//app.use(function*(){
    //yield this.render('login',{});
//});

router.post('/loginHandle',function* (next){
  //使用了koa-bodyparser以后，解析后的数据会存放到this.request.body里面
  global.jsondata = this.request.body;
  yield dataValidate(next);
  //如果验证正确跳转到sign_in页面
  this.redirect('/sign_in');
});

router.get('/sign_in',function* (next){
  this.body = ' Hello ' + global.jsondata.name +', welcome back! ';
});

router.get('*',function* (){
  this.body = '404 not found this page!';
});

//数据验证相关
function* dataValidate(next){
  var name = global.jsondata.name,
      pass = global.jsondata.pass;
  console.log('name:',name,' pass:',pass);
  if( name != 'ann' || pass != '123456' ){
    //如果name和pass不符合我们的判断条件
    console.log('wrong');
    return yield next;
  }else{
    console.log('validate ok');
  }
}

app.use(bodyParser());
app.use(router.routes());
app.listen(8089);