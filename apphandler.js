//把路由处理相关的部分，单独放到routes.js文件中
var express = require('express');
var exphbs = require('express3-handlebars');
var bodyParser = require('body-parser');
var app = express();
var routes = require('./routeshandler');
//routeshandler将路由按照功能进行分块

app.set('view engine','html');
app.engine('html',exphbs(
  {
    defaultlayout:false,
    extname:'.html',
    helpers:{
      ifEqual:function(v1,operator,v2,options){
        switch(operator){
          case '==':{
            return (v1 == v2)?options.fn(this):options.inverse(this);
            break;
          }
          case '===':{
            return (v1 == v2)?options.fn(this):options.inverse(this);
            break;
          }
        }
      }
    }
  }
));
app.use(bodyParser());
//设置文件访问的路径
app.use(express.static(__dirname+'/public'));

//路由的相关处理操作
routes(app);//设置路由
app.listen(8088);//开启路由