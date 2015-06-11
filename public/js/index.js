$(function(){
    var dom = {
      table:$('.j-table'),
      file:$('.j-file'),
      img:$('#img'),
      name:$('.j-name'),
      size:$('.j-size'),
      upload:$('.j-upload'),
      cancel:$('.j-cancel')
    };

    var hideClass = 'f-hide',
        disabledClass = 'disabled';


    var controller = {
      bindEvents:function(){
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
        dom.file.on('change',function(){
          console.log('file change');
          var filearr = dom.file.get(0).files;
              file = filearr[0],
              reader = new FileReader();
          reader.onload = function(e){
            dom.img.removeClass(hideClass);
            dom.img.attr('src',e.target.result);
            dom.name.html(file.name);
            dom.size.html((file.size/1024).toFixed(2)+'MB');

            dom.upload.removeClass(disabledClass);
            dom.cancel.removeClass(disabledClass);
          };
          reader.readAsDataURL(file);
        });
      },
      uploadFile:function(){
        /**
         * 点击了文件上传
         */
        dom.upload.on('click',function(req,res){
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

    var view = {

    };
    

    //main 入口脚本
    var main = function(){

    };
    

  });