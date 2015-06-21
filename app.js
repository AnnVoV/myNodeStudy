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
  },
  setData:function(data){
    model.orderList.push(data);
  },
  delData:function(){

  }
}

app = express();
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')());
//必须要先引入这个cookie-parser 才能使用express-session模块
//再使用session 
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(__dirname+'/public'));


app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine','hbs');

app.use(function(req,res,next){
  if(req.session){
    console.log('first use middleware: ',req.session.orderList);
  }
  next();
});

app.get('/register',function(req,res){
  res.render('register',data.getPlaces());
});

app.post('/registerHandler',function(req,res){
  if(req.xhr){
    var location = req.body['location'],
        size = req.body['size']-'',
        price = req.body['price']-'',
        totalAmount = price*size;
    controller.setData({location:location,price:totalAmount});
    req.session.orderList = controller.getData();
    //设置app.locals.orderList的值
    return res.json({success:true});
  }
  //跳转到orderList页面
  return res.redirect(303,'/orderList');
});

//订单列表页
app.get('/orderList',function(req,res){
  //注意：carList 应该是一个数组，
  res.render('shoppingcars',{orderList:req.session.orderList});
});

app.listen(8088);