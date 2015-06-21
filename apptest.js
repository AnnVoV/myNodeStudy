var express = require('express'),
    app = express(),
    path = require('path'),
    credentials = require('./credentials'),
    touristData = require('./tourist'),
    bodyParser = require('body-parser');

var exphbs = require('express3-handlebars');
/*exphbs.create({defaultLayout:'main.hbs'});*/

app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());
app.use(express.static(__dirname + '/public'));
/*app.use(express.static(path.join(__dirname+'/views')));*/
app.use(bodyParser.urlencoded({
  extended:true
}));
//设置模板引擎
app.engine('.hbs', exphbs({extname: '.hbs',defaultLayout:'main.hbs'}));
app.set('view engine', '.hbs');

app.use(function(req, res, next){
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});




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
  //通过res.locals.words 设置的变量可以直接吐在页面上
  res.locals.words = model.getConData().words;
  next();
});

app.get('/',function(req,res){
  res.render('testcontent');
});

app.get('/register',function(req,res){
  res.render('register',touristData.getPlaces());
});

app.post('/registerHandler',function(req,res){
     
});


app.listen(8088);