//把路由处理相关的方法都放在一个脚本里面
module.exports = function(app){
  app.get('/',function(req,res){
    res.send('Hello World!');
  });

  app.get('/customer',function(req,res){
    res.send('customer page');
  });
} 