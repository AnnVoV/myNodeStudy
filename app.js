var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express3-handlebars');
var data = require('./tourist');
var credentials = require('./credentials');
var model = {orderList:[]};//数据集合
var controller = {
  getData:function(){
    return model.orderList;
    //返回数据数组
  }
}


app = express();
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());
//必须要先引入这个cookie-parser 才能使用express-session模块
//再使用session 
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));

// flash message middleware
app.use(function(req, res, next){
  // if there's a flash message, transfer
  // it to the context, then clear it
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});


app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine','hbs');

app.get('/register',function(req,res){
  res.render('register',data.getPlaces());
});

/*app.post('/registerHandler',function(req,res){
    if(req.xhr) 
      //必须要先使用return 设置响应头
      return res.json({success:true});
    req.session.flash = {
      type: 'success',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.',
    };
  return res.redirect(303, '/archieve');
  //注意跳转页面的这里要写return
});*/

app.post('/registerHandler',function(req,res){
    if(req.xhr){
      return res.json({success:true});
    } 
    req.session.flash = {
      type: 'success',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.',
    };
    //res.end();
  return res.redirect(303, '/archieve');
});


app.get('/archieve',function(req,res){
  //渲染页面
  res.render('archieve');
  res.end();
});

app.get('/shoppingcar',function(req,res){
  if(req.xhr){
     var size = req.query['size'],
         price = req.query['price'],
         location = req.query['location'],
         totalMon = size*price;
     model.orderList.push({location:location,price:totalMon});
     return res.json({success:true});  

    //设置flash 即显消息
    req.session.flash = {
      type: 'success',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.',
    };
  }
  console.log('继续执行.....');
  //页面跳转
  return res.redirect(303, '/archieve');
});

//订单列表页
app.get('/orderList',function(req,res){
  console.log(controller.getData());
  res.render('shoppingcars',controller.getData());
  res.end();
});



app.listen(8088);