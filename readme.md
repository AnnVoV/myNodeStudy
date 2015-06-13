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