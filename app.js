var express = require('express');
var app = express();

app.use(express.static(__dirname));


app.get('/mockData1',function(req,res){
  console.log('发起到mockData的请求返回数据....');
  var data = {
    name:'ann',
    job:'front-web-eng',
    like:'shopping',
    skill:'Node、H5、CSS3'
  };
  res.send(data);
});

app.get('/mockData2',function(req,res){
  console.log('发起到mockData2的请求返回数据....');
  var data = {
    name:'Taiwan',
    price:'8000',
    goal:'一定要去玩',
    describe:'我喜欢海边'
  };
  res.send(data);
});
app.listen(8088);