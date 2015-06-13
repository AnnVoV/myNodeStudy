var express = require('express'),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    path = require('path');

var app = express();

app.use(express.static(path.join(__dirname,'/public')));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/views/fileupload.html');
});

app.post('/picHandler',function(req,res){
  //如果是ajax 请求
  if(req.xhr){
    //我们要处理上传来的文件
    res.send({code:0});
  }else{
    //如果上传文件失败
    res.send({code:-1,msg:"上传文件失败！"});
  }
});

app.listen('3000')