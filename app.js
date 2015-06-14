var express = require('express'),
    bodyParser = require('body-parser'),
    //处理form 的enctype为multipart/form-data 的插件
    multipart = require('connect-multiparty'),
    fs = require('fs'),
    path = require('path');

var app = express();
var multipartMiddleware = multipart();

app.use(express.static(path.join(__dirname,'/public')));
app.use(bodyParser.urlencoded({ extended:true,limit:'50mb'}));
app.set('uploadPath',path.join(__dirname,'/public/uploads'));


app.get('/',function(req,res){
  res.sendFile(__dirname+'/views/fileupload.html');
});

app.post('/picHandler',multipartMiddleware,function(req,res){
  //如果是ajax 请求
  if(req.xhr){
    //我们要处理上传来的文件
    //通过req.files 可以看到上传的相关的文件信息
    //通过req.files 可以获得上传文件的数据
     var fileobj = req.files,//获取上传的file对象
         temppath = fileobj.files.path,
         date = new Date(),
         month = 0,
         upFileName = '';

      month = date.getMonth()+1;
      month = (month.length<2)?'0'+month:month;
      upFileName = ""+ date.getFullYear() + month + date.getDate()+date.getHours()+date.getMinutes();
      //读取上传的文件并且把文件内容保存到public/uploads 文件夹下
      fs.readFile(temppath,function(err,data){
        if(err){
          throw err;
          res.send({code:-1});
        }
        //保存上传的文件内容
        fs.writeFile(app.get('uploadPath')+'/'+ upFileName +'.jpg',data,function(err,data){
          if(err)throw err;
          res.send({code:0});
        });
      });
  }else{
    //如果上传文件失败
    res.send({code:-1,msg:"上传文件失败！"});
  }
});

app.listen('3000')