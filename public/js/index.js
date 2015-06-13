define(function(require,exports,module){
  var $ = require('jquery');
  //注意在gulpfile.js的gulp-seajs-combo 插件里面设置ignore:jquery
  //查看jquery 是否成功引入
  //alert($);
  //动态模板文件
  var tpl = require('../../views/tpl/table.tpl');

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
    


    /*var controller = {
      bindEvents:function(){
        console.log('bind events');
        this.selectFile();
        this.uploadFile();
      },
      selectFile:function(){
        /**
         * 选择了文件
         *选择文件上传 触发的是change事件 
         *使用FileReader 对象 readAsDataURL 读取文件内容
         *onload 的时候通过e.target.result 得到读取的文件的结果
         */
    /*    dom.file.on('change',function(){
          var filearr = dom.file.get(0).files,
              file = filearr[0],
              reader = new FileReader();

          reader.onload = function(e){
            /*dom.img.removeClass(hideClass);
            dom.img.attr('src',e.target.result);
            dom.name.html(file.name);
            dom.size.html((file.size/1024).toFixed(2)+'MB');

            dom.upload.removeClass(disabledClass);
            dom.cancel.removeClass(disabledClass);*/
            /**
             * 添加上传的数据
             */
    /*        var data = {
              img:e.target.result,
              name:file.name,
              size:(file.size/1024).toFixed(2)+'MB'
            };//数据模型

            console.log(data);
            model.setData(data,dom.table);
            /*var templ = model.setData(data);
            console.log('templ',templ);
            dom.table.html(templ);*/
    /*      };
          reader.readAsDataURL(file);
        });
      },
      uploadFile:function(){
        /**
         * 点击了文件上传
         */
    /*    dom.upload.on('click',function(req,res){
          var formData = new FormData($('form')[0]);
          $.ajax({
            url:'/picHandler',
            type:'post',
            data:formData,
            processData:false,
            contentType:false,
            success:function(data){
              if(data.success){
                alert('success');
              }
            },
            error:function(){
              res.send('error');
            }
          });
        });
      }
    };
*/
 
 /*   var view = {

    };

    var model = {
      setData:function(data,container){
        var template = Handlebars.compile($('#tpl').html());
        container.html(template(data));
      } 
    };
    

    //main 入口脚本
    var main = function(){
      controller.bindEvents();
    };
    
    main();

  });*/