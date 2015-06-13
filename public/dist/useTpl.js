define('test.tpl',function(){return Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<div>This is test Handlebars tpl.</div>\n<div>Hi~~~ I'm "
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"name","hash":{},"data":data}) : helper)))
    + "</div>\n<div>"
    + alias3(((helper = (helper = helpers.words || (depth0 != null ? depth0.words : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"words","hash":{},"data":data}) : helper)))
    + "</div>";
},"useData":true})});
define('useTpl',['test.tpl'],function(require){
  var tpl = require('test.tpl');
  var dom = document.getElementById('result');
  //通过调用模板方法对dom 元素赋值
  dom.innerHTML = tpl(
    {name:'ann',words:'What the hell about the truth!'}
  );
});
