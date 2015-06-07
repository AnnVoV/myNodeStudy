var express = require('express');
var app = express();
var hbs = require('hbs');
var blogEngine = require('./blog');

//对于html 文件使用view engine 引擎渲染
app.set('view engine','html');
//注册模板引擎
app.engine('html',hbs.__express);


//res.render('index') 意味着设置Express去寻找views/index.html 文件
app.get('/',function(req,res){
  res.render('index',{title:'My Blog',entries:blogEngine.getBlogEntries()});
});

app.get('/about',function(req,res){
  res.render('about',{title:'About Me'});
});

app.get('/article/:id',function(req,res){
  var entry = blogEngine.getBlogEntry(req.params.id);
  res.render('article',{title:entry.title, blog:entry});
});

app.listen(3000);