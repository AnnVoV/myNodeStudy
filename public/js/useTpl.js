define(function(require){
  //直接require 模板文件，gulpfile 会对其进行处理
  var tpl = require('../../views/tpl/test.tpl');
  var dom = document.getElementById('result');
  //通过调用模板方法对dom 元素赋值
  dom.innerHTML = tpl(
    //传递要填充进模板文件中的数据
    {name:'ann',words:'What the hell about the truth!'}
  );
});