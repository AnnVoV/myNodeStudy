var app = require('./lib/koa')(require('koa')(),{
    views:'./views'
}),
    router = require('koa-router')(),
    //使用koa-bodyparser 组件处理post来的数据
    bodyParser = require('koa-bodyparser'),
    global = {};

router.get('/',function* (){
  if(this.cookies.get('name') && this.cookies.get('pass')){
    //如果存储过name于pass的相关cookie信息
    console.log('enter into cookie...');
    var name = this.cookies.get('name'),
        pass = this.cookies.get('pass'),
        cookieData = {name:name,pass:pass};
    //如果有cookie直接把数据绘制到前端
    yield this.render('login',{cookieData:cookieData});
  }else{
    yield this.render('login',{});
  }
});

router.get('/test',function* (next){
  console.log('enter test');
  yield this.render('test',
    { name: "foo", 
      array: [
        {name: "bar"},
        {name: "ann"},
        {name: "amber"}
      ]
    }
  );
})

router.post('/loginHandle',function* (next){
  //使用了koa-bodyparser以后，解析后的数据会存放到this.request.body里面
  global.jsondata = this.request.body;
  yield dataValidate(next);
  //如果验证正确跳转到sign_in页面
  if(!this.cookies.get('name') && !this.cookies.get('pass')){
    this.cookies.set('name',global.name);
    this.cookies.set('pass',global.pass);
  }
  this.redirect('/sign_in');
});

router.get('/sign_in',function* (next){
  yield this.render('signin',{});
});

router.get('*',function* (){
  this.body = '404 not found this page!';
});

//数据验证相关
function* dataValidate(next){
  var name = global.jsondata.name,
      pass = global.jsondata.pass;
  global.name = name;
  global.pass = pass;
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