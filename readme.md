####
  将seajs 和 handlebars 结合使用
####
方法：  
 (1)html中要引入sea.js 和handlebars.js 文件  
 (2)在主js脚本里面，我们通过var tpl = require('*.tpl')直接引入模板文件  
 (3)通过 tpl({data...}) 直接给模板文件传值  

####
  gulpfile.js 的写法： 

  ````
    var gulp = require('gulp'),
        handlebars = require('gulp-handlebars'),
        wrap = require('gulp-wrap'),
        seajsCombo = require('gulp-seajs-combo');
    
    /使用gulp-handlebars 和 gulp-seajs-combo 插件
    gulp.task( 'seajscombohbs', function(){
        return gulp.src( 'public/js/useTpl.js' )
            .pipe( seajsCombo({
                plugins : [{
                    ext : [ '.tpl' ],
                    use : [{
                            plugin : handlebars,
                        },{
                            plugin : wrap,
                            param : ['define(function(){return Handlebars.template(<%= contents %>)});']
                    }]
                }]
            }))
            .pipe( gulp.dest('public/dist'));
    });
  ````  
####
  这样我们直接通过执行gulp seajscombohbs 就能得到合并后的文件，直接使用合并后的主脚本即可。  
  gulpfile里面通过使用gulp-wrap 和 gulp-handlebars 把.tpl 文件封装成了seajs可以使用的.js  
  然后与主脚本文件进行了合并。


