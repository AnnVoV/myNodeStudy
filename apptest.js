var express = require('express'),
    app = express(),
    path = require('path'),
    bodyParser = require('body-parser');

var handlebars = require('express3-handlebars').create(
    {defaultLayout:'testmain.handlebars'}
);

app.use(express.static(path.join(__dirname+'/public')));
app.use(express.static(path.join(__dirname+'/views')));
//设置模板引擎
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


var model = {
  getConData:function(){
    return {
      words:[
        {name:"ann",words:"I know it's the fact!"},
        {name:"annyran",words:"What the hell!"},
        {name:"annvov",words:"It's the face time!"}
      ]
    };
  }
};

//先在最上层获得数据，然后再调用next
//并且利用req.locals 存储到全局里
app.use(function(req,res,next){
  console.log(model.getConData());
  res.locals.words = model.getConData().words;
  next();
});

app.get('/',function(req,res){
  res.render('testcontent');
});

app.listen(8088);