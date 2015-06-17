var express = require('express');
var bodyParser = require('body-parser');
var handlebars = require('express3-handlebars')
app = express();

app.use(express.static(__dirname+'/public'));
app.use(bodyParser({urlEncoded:true}));
app.engine('hbs', exphbs({
  layoutsDir: 'views',
  defaultLayout: 'layout',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');

app.listen(8088)