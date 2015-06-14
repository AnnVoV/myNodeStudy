define('table.tpl',function(){return Handlebars.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
    var helper, alias1=helpers.helperMissing, alias2="function", alias3=this.escapeExpression;

  return "<tr>\n  <td>\n    <img src=\""
    + alias3(((helper = (helper = helpers.img || (depth0 != null ? depth0.img : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"img","hash":{},"data":data}) : helper)))
    + "\" id=\"img\" width=\"100px\" height=\"100px\" class=\"f-hide\"/>    \n  </td>\n  <td>\n  <div><span class=\"j-name\">"
    + alias3(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"name","hash":{},"data":data}) : helper)))
    + "</span></div>\n  </td>\n  <td><span class=\"j-size\">"
    + alias3(((helper = (helper = helpers.size || (depth0 != null ? depth0.size : depth0)) != null ? helper : alias1),(typeof helper === alias2 ? helper.call(depth0,{"name":"size","hash":{},"data":data}) : helper)))
    + "</span></td>\n  <td>\n    <button type=\"button\" class=\"btn btn-primary j-uploadFile disabled\">上传</button>\n    <button type=\"button\" class=\"btn btn-info j-cancelFile disabled\">取消</button>\n  </td> \n</tr>";
},"useData":true})});
define('index',['jquery','table.tpl'],function(require,exports,module){
  var $ = require('jquery');
  //注意在gulpfile.js的gulp-seajs-combo 插件里面设置ignore:jquery
  //查看jquery 是否成功引入
  //动态模板文件
  var tpl = require('table.tpl');

  var dom = {
    file:$('.j-addFile'),
    upload:$('.j-uploadFile'),
    cancel:$('.j-cancelFile'),
    table:$('.j-table')
  };

  var controller = {
    init:function(){
      //选择上传文件的事件绑定
      this.selectFile();
    },
    selectFile:function(){
      dom.file.on('change',function(){
        // 这个怎么只执行了一次 发现:相同的文件只执行了一次
        // 如何设置执行多次？？？？
        var filearr = dom.file.get(0).files,//获取上传的文件
            file = filearr[0],
            reader = new FileReader();

        reader.readAsDataURL(file);
        reader.onloadend = function(e){
          //读取的文件的数据
          var readerData = {};
          readerData = model.getData(file,e);
          //把数据填充到tpl模板中
          var $row = view.getNewRow(tpl,readerData);
          view.refresh($row);
        };
      });
    },
    bindEvents:function($upload,$cancel,$row){
      //绑定上传事件和取消上传事件 
      $cancel.on('click',function(){
        console.log('点击了取消按钮');
        $row.remove();
      });

      $upload.on('click',function(){
        console.log('ajax 上传文件');
        var formData = new FormData($('form')[0]);

        //要上传的文件数据
        $.ajax({
          url:'/picHandler',
          type:'post',
          data:formData,
          processData:false,
          contentType:false,
          success:function(data){
            if(data.code == 0){
              alert('上传文件成功');
            }else{
              alert(data.msg);
            }
          },
          error:function(){
            console && console.log('请求错误');
          }
        });
      });
    }
  };

  var view = {
    getNewRow:function(tpl,readerData){
      var resultHtml = tpl(readerData),
          jq_row = $(resultHtml);

      return $(resultHtml);
    },
    refresh:function($newdata){
      dom.table.append($newdata);
      var $img = $($newdata.find('img')),
          $upload = $($newdata.find('.j-uploadFile')),
          $cancel = $($newdata.find('.j-cancelFile'));

      $img.removeClass('f-hide');
      //取消按钮的禁止使用状态
      $upload.removeClass('disabled');
      $cancel.removeClass('disabled');
      controller.bindEvents($upload,$cancel,$newdata);

    } 
  };

  var model = {
    getData:function(file,e){
      return {
        img:e.target.result,
        name:file.name,
        size:(file.size/1024).toFixed(2)+'MB'
      }
    }
  };

  //入口脚本
  var main = function(){
    controller.init();
  };
  main();
});
