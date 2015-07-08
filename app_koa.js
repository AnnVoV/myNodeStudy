var koa = require('koa'),
    app = koa();
//变量app就是一个koa应用 
   
//next是中间调用件
//设置是否要跳过某个中间件不执行
//var skip2 = true;

app.use(function* (next){
  console.log('>> one');
  yield next;
  console.log('<< one');
});

app.use(function* (next){
  if(skip2) return yield next;
  console.log('>> two');
  yield next;
  console.log('<< two');
});

app.use(function* (next){
  console.log('>> three');
  yield next;
  console.log('<< three');
});

app.listen(8088);

//function* 里面的next 参数，默认是去调用下一个中间件
//console.log结果为：
//>> one
//>> two
//>> three
//<< three
//<< two
//<< one