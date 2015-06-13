####
  通过使用gulp-seajs-combo 插件我们可以合并我们的seajs文件  
  [gulp-seajs-combo](https://github.com/chenmnkken/gulp-seajs-combo/blob/master/README_CN.md)

####
  gulp-seajs-combo 的目的  
````  
  a.js  
  define(function(require,exports,module){
    var result1 = 'this is a.js',  
        b = require('./b.js'),  
        result = result1+b,  
        dom = document.getElementById('test');  
         
    dom.innerHtml = resut;
  });  
````  
  

````
  b.js  
  define(function(require,exports,module){
    module.exports = "I know it's the fact!";
  });

````  
  
####
  使用gulp-seajs-combo 它会将两个文件合并为一个文件，我觉得这个插件比spm 好用太多了  
  ````
    define('b',function(require,exports,module){
      return " I know it's the fact!";
    });
    define('a',['b'],function(require,exports,module){
       var b = require('b'),
           resultstr = 'What the hell!'+ b,
           dom = document.getElementById('result');

        dom.innerHTML = resultstr;
    });  
  ````
####
  进入该项目 node app.js 在url中访问 http://localhost:3000/index.html,即可看到效果


