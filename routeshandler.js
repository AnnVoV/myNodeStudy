var main = require('./handlers/main');
var tourplace = require('./handlers/tourplace');

module.exports = function(app){
  //把app 和相关的路由处理分开，这样调理比较清晰
  //about 部分的route
  app.get('/',main.main);
  app.get('/about',main.about);

  //tourPlace 部分的route
  app.get('/tourPlace/:place',tourplace.tourList);
  app.get('/tourPlace/:place',tourplace.tourListNext);
};