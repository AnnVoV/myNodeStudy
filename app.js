var express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    app = express();

var handlebars = require('express3-handlebars').create({
    /* 默认的主模板为main */
    defaultLayout:'main',
    helpers: {
        //设置handlebars 里面的自定义标签
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});

app.use( express.static(path.join(__dirname+'/public')));

//模拟数据接口
var model = {
  getInfoData:function(){
    return {
        locations: [
            {
                name: 'Portland',
                forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather: 'Overcast',
                temp: '54.1 F (12.3 C)',
            },
            {
                name: 'Bend',
                forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather: 'Partly Cloudy',
                temp: '55.0 F (12.8 C)',
            },
            {
                name: 'Manzanita',
                forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
                iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather: 'Light Rain',
                temp: '55.0 F (12.8 C)',
            },
        ],
    };
  }
};



//设置模板引擎
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');


app.use(function(req,res,next){
  if(!res.locals.partials) res.locals.partials = {};
  //res.locals 在一个对话中是全局的，对话结束内容会被清空，不同于app.locals 这是在一个应用中是全局的
  //获取模拟的数据对象并且把它填充到weather 中
  res.locals.partials.weather = model.getInfoData();
  next();
});


//首页
app.get('/',function(req,res){
  res.render('home');
});

app.listen(8088);