# myNodeStudy
表单提交之文件上传  
具体内容请阅读：
[常见的post提交数据的方式](https://www.imququ.com/post/four-ways-to-post-data-in-http.html)  
[node 中对应表单类型的方法使用](http://yijiebuyi.com/blog/90c1381bfe0efb94cf9df932147552be.html)  
注意：文件上传的时候enctype="multipart/form-data"    
我们需要使用 connect-multiparty 插件来处理，而非body-parser  
这样我们可以通过req.body 和 req.files 看到上传的文件的数据  
例如：  
````
 app.post('/picHandler',multipartMiddleware,function(req,res){
  //如果是ajax 请求
  if(req.xhr){
    //我们要处理上传来的文件
    //通过req.files 可以看到上传的相关的文件信息
    //通过req.files 可以获得上传文件的数据
     var fileobj = req.files,//获取上传的file对象
         temppath = fileobj.files.path,
         date = new Date(),
         month = 0,
         upFileName = '';

      month = date.getMonth()+1;
      month = (month.length<2)?'0'+month:month;
      upFileName = ""+ date.getFullYear() + month + date.getDate()+date.getHours()+date.getMinutes();
      //读取上传的文件并且把文件内容保存到public/uploads 文件夹下
      fs.readFile(temppath,function(err,data){
        if(err){
          throw err;
          res.send({code:-1});
        }
        //保存上传的文件内容
        fs.writeFile(app.get('uploadPath')+'/'+ upFileName +'.jpg',data,function(err,data){
          if(err)throw err;
          res.send({code:0});
        });
      });
  }else{
    //如果上传文件失败
    res.send({code:-1,msg:"上传文件失败！"});
  }
});  
````  

前端ajax 注意设置:  
  processData:false,  
  contentType:false  





