//关于页面的路由处理
var data = require('../data');

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

exports.tourList = function(req,res,next){
  var place = req.params.place;
  model.param_place = place;
  if(!place)return next();//最终会落入404
  next();
}

exports.tourListNext = function(req,res){
  view.showDetailView(req,res);
}