var express = require('express');
var path = require('path');
var app = express();
var bodyParser = require('body-parser');
var hbs = require('hbs');
/*var handlebars = require('express3-handlebars')
    .create({ defaultLayout: 'main','extname':'.hbs'});*/


/*app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars'); */
app.set('view engine','html');
app.engine('html',hbs.__express);
app.set('views',path.join(__dirname,'views'));

app.use(express.static(path.join(__dirname, '/public')));

app.get('/fileupload',function(req,res){
  res.render('fileupload.html',{layout:null});
});

app.get('/test',function(req,res){
  res.render('test.html',{layout:null});
});

app.post('/pichandler',function(req,res){
  if(req.xhr){
    res.send({success:true});
  }else{  
    res.send('wrong');
  }
});

app.listen(8088);