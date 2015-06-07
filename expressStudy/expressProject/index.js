var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');


//设置html变量的值
app.set('html',__dirname+'/www/views');
//文件目录映射，把www路径下的内容映射到/下
app.use('/',express.static(__dirname+'/www'));
//设置bodyParser
app.use(bodyParser.urlencoded(
  {extended:true}
));


app.get('*',function(req,res){
  console.log('url',req.url);
  var filepath = app.get('html')+req.url;
  res.sendFile(filepath);
  //发送对应的文件请求
});

//login.html页面 对应的后台处理
app.post('/loginHandler',function(req,res){
  console.log('reqbody: ',req.body);
  res.send(req.body);
});

app.listen(8088); 