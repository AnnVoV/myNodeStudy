//我们通过传入app参数,路由的相关处理
module.exports = function(app){
  //路由的相关处理操作
  var data = require('./data.js');
  var model = {
    param_place:null,
    detailList:null
  };

  var controller = {
    getDetail:function(){
      model.detailList = data.getDetailList();
      console.log('detailListInfo:',model.detailList);
    }
  };

  var view = {
    showDetailView:function(req,res){
      //查看详细景点页面  
      var place = model.param_place;
      console.log('detailPlace:',place);
      controller.getDetail();
      res.render('tourPlace.html',model.detailList[place]);
    }
  };

  app.get('/',function(req,res){
    var touristArr = data.getPlaceList();
    res.locals.minSize = 1;
    res.locals.maxSize = 50;
    res.render('index.html',{placeList:touristArr});
    //我们可以通过设置data参数的方式，也可以使用通过res.locals注入的方式
  });

  app.get('/tourPlace/:place',function(req,res,next){
    var place = req.params.place;
    model.param_place = place;
    if(!place)return next();//最终会落入404
    //渲染具体的景点页面
    next();
  },view.showDetailView);

  //最后一个处理路由,任何一个url都没有匹配
  app.use(function(req,res){
    console.log('no match');
    res.render('404.html');
  });
};