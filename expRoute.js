var express = require('express');
var router = express.Router();
var bodyParser =  require('body-parser');
var exphbs = require('express3-handlebars');
var app = express();

app.use(bodyParser());
//访问静态文件的路径
app.use(express.static(__dirname+'/public'));
app.set('view engine','html');
app.engine('html',exphbs(
  {
    defaultlayout:false,
    extname:'.html'
  }
));
/*
//通过使用router,对不同的访问路径指定回调函数，然后挂载到某个路径
router.get('/',function(req,res){
  res.render('test');
});

router.get('/about',function(req,res){
  res.render('about');
});

//我们通过app.use挂载到根目录
app.use('/',router);*/

//我们用app.route 去写路由，显得更加的清楚和简洁
//而且可以进行链式调用
app.route('/about')
  .get(function(req,res){
    res.render('about',
    {
      tourlist:[
        {href:'#',place:'台湾'},
        {href:'#',place:'日本'},
        {href:'#',place:'美国'}
      ]
    });
  })
  .post(function(req,res){
    console.log('content: ',req.body);
    res.send('信息已经提交成功!');
  });

app.listen(8088);


