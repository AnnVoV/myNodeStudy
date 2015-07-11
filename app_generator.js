var koa = require('koa'),
    app = koa();

var testMethod = function(data){
  //koa 中app.use的参数必须为next
  return function* (next){  
    console.log('这是执行的第一个中间件');
    data++;
    //我之前写的document.body
    //后台程序拿不到前端页面的document.body
    //那为什么写this就可以拿到
    this.body += "Hello World!"+data;
    //如果带有next 参数则默认去掉用下一个中间件
    yield next;
  };
};

app.use(logger(':method:url'));
app.use(testMethod(1));

app.use(function* (next){
  console.log('这是下一个中间件');
  console.log('-------- end --------');
  //注意这里不要写成了 yield next()
  yield next;
});

app.use(function* (){
  this.body+='\n header \n';
  //如果这里不绑定this 会出错，但并不理解原因
  yield theLastGen.call(this);
  this.body+=' footer\n';
});

function* theLastGen(){
  this.body+=' body\n'
  console.log('--------- last 中间件 -------');
}

function logger(format){
  return function* (next){
    var str = format
      .replace('method',this.method)
      .replace('url',this.url);

    console.log('format str:',str);
    yield next;
  }
}




app.listen(8089);

//注意：在Koa框架中，我们要使用app.use 默认的参数必须为next
//所以如果我们使用了自定义的函数我们必须自己返回一个generator函数
//要把它包裹起来