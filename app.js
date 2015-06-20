var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express3-handlebars');
var data = require('./tourist');
var session = require('express-session');
var credentials = require('./credentials');
app = express();

app.use(express.static(__dirname+'/public'));
app.use(bodyParser.urlencoded({extended:false}));
app.use(require('cookie-parser')(credentials.cookieSecret));
//必须要先引入这个cookie-parser 才能使用express-session模块
app.use(session());
//使用session 

app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine','hbs');

app.get('/register',function(req,res){
  res.render('register',data.getPlaces());
});

app.get('/shoppingcar',function(req,res){
  console.log(req.query);
  
});

app.listen(8088);