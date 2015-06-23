var express = require('express');
var bodyParser = require('body-parser');
//express-handlebars 模块
var exphbs = require('express3-handlebars');
//引入文件模块
var fs = require('fs');
var app = express();
//相关的数据配置
var data = require('./data');
var autoViews = {};


//静态文件访问
app.use(express.static(__dirname+'/public'));
app.set('env','development');

//设置模板引擎的后缀名为html
app.set('view engine','html');
app.engine('html',  exphbs(
    {
      defaultlayout:false,
      //设置默认的扩展名
      extname:'.html',
      helpers:{
        ifEqual:function(v1,operator,v2,options){
          switch(operator){
            //自定义helper模块 这样我们可以通过 {{#ifEqial v1 '==' v2}}来使用
            case '==':{
              return (v1 == v2) ? options.fn(this) : options.inverse(this);
              break;
            }
            //自定义helper模块 这样我们可以通过 {{#ifEqial v1 '===' v2}}来使用
            case '===':{
              return (v1 == v2) ? options.fn(this) : options.inverse(this);
              break;
            }
          }
        }
      }
    }
));

// 开启日志 相关的日志处理配置
switch(app.get('env')){
    case 'development':
      // compact, colorful dev logging
      app.use(require('morgan')('dev'));
        break;
    case 'production':
        // module 'express-logger' supports daily log rotation
        app.use(require('express-logger')({ path: __dirname + '/log/requests.log'}));
        break;
}

var model = {
  param_place:null,
  detailList:null,
  tourList:null
};

var controller = {
  getDetail:function(){
    model.detailList = data.getDetailList();
  }
};

var view = {
  showDetailView:function(req,res){
    //查看详细景点页面  
    var place = model.param_place;
    controller.getDetail();
    res.render('tourPlace.html',model.detailList[place]);
  }
};

//路由的相关处理操作
app.get('/',function(req,res){
  var touristArr = data.getPlaceList();
  res.locals.minSize = 1;
  res.locals.maxSize = 50;
  res.render('index.html',{placeList:touristArr});
  //我们可以通过设置data参数的方式，也可以使用通过res.locals注入的方式
});

app.get('/about',function(req,res){
  var touristList = data.getTouristList();
  console.log('tourList:',touristList);
  res.render('about.html',{tourlist:touristList});
});

//注意这里的next() 后面我们还有一个view.showDetailView
app.get('/tourPlace/:place',function(req,res,next){
  var place = req.params.place;
  model.param_place = place;
  if(!place)return next();//最终会落入404
  //渲染具体的景点页面
  next();
},view.showDetailView);


app.use(function(req,res,next){
  var path = req.path.toLowerCase();
  if(autoViews[path]){
    return res.render(autoViews[path]);
  }
  if(fs.existsSync(__dirname+'/views/'+path+'.html')){
    autoViews[path] = path.replace(/^\//,'');
    //如果文件存在的话
    //说明render 后面的文件名不一定要加上后缀的
    return res.render(autoViews[path]);
  };
  next();
});

//最后一个处理路由,任何一个url都没有匹配
app.use(function(req,res){
  console.log('未找到对应文件');
  res.render('404.html');
});

//开启端口
app.listen(8088);