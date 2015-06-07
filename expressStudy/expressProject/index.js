var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


//设置html变量的值
app.set('html',__dirname+'/www/views');
//文件目录映射，把www路径下的内容映射到/下
app.use('/',express.static(__dirname+'/www'));
//设置bodyParser中间件
app.use(bodyParser.urlencoded(
  {extended:true,limit:'1mb'}
));
//设置cookieParser中间件
app.use(cookieParser());


app.get('*',function(req,res){
  console.log('url',req.url);
  var filepath = app.get('html')+req.url;
  res.sendFile(filepath);
  //发送对应的文件请求
});

//login.html页面 对应的后台处理 使用了body-parser 和cookie-parser 中间件
app.post('/loginHandler',function(req,res){
  //使用cookie-parser 中间件以后可以通过req.cookies 获取cookie的json对象
  //console.log('reqcookies:',req.cookies);
  //使用body-parser 中间件以后可以通过req.body 获得前端传来的数据
  //console.log('reqbody: ',req.body);
  
  var cookiedata = req.cookies;
  if( cookidata && cookiedata.name == 'ann' && cookiedata.pass == '12345678'){
    res.send( 'Hi~' + cookiedata.name +' welcome back!:)' );
  }else{
    res.send(503);
  }
});

app.listen(8088); 