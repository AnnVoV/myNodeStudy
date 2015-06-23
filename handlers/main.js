//主页的路由处理
var data = require('../data');

exports.main = function(req,res){
  var touristArr = data.getPlaceList();
  res.locals.minSize = 1;
  res.locals.maxSize = 50;
  res.render('index.html',{placeList:touristArr});
};

exports.about = function(req,res){
  var touristList = data.getTouristList();
  res.render('about.html',{tourlist:touristList});
};
