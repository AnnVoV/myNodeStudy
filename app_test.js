var express = require('express'),
    fs = require('fs'),
    multipart = require('connect-multiparty'),
    //关于文件上传，使用的不是body-parser 而是connect-multiparty
    path = require('path');

var app = express();
var multipartMiddleware = multipart();

app.set('uploadPath',path.join(__dirname,'/public/uploads'));
//设置静态文件的访问
app.use(express.static(path.join(__dirname,'/public')));

app.get('/',function(req,res){
  res.sendFile(__dirname+'/views/fileupload.html');
});

app.get('/test',function(req,res){
  res.sendFile(__dirname+'/views/test.html');
});

//文件提交的相关处理
app.post('/testHandler',multipartMiddleware,function(req,res){
   //通过req.files 可以获得上传文件的数据
   var fileobj = req.files.file,//获取上传的file对象
       temppath = fileobj.path,
       date = new Date(),
       month = 0,
       upFileName = '';

    month = date.getMonth()+1;
    month = (month.length<2)?'0'+month:month;

    upFileName = ""+ date.getFullYear() + month + date.getDate();
    console.log(upFileName);

   fs.readFile(temppath,function(err,data){
    if(err)throw err;
    //保存上传的文件内容
    fs.writeFile(app.get('uploadPath')+'/'+ upFileName +'.jpg',data,function(err,data){
      if(err)throw err;
      console.log('data is saved!');
    });
   });
});

app.listen('3000');