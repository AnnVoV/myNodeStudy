var app = require('./lib/koa')(require('koa')(),{
    views:'./views'
});

app.use(function*(){
    yield this.render('index',{data:1});
});

app.listen(8089);