var express = require('express');
var app = express();
var path = require('path');


//直接访问静态目录

//静态资源可以直接访问
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));


app.listen(3000);