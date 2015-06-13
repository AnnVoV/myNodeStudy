var gulp = require('gulp'),
    handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    seajsCombo = require( 'gulp-seajs-combo' );


//合并seajs 文件,使用gulp-seajs-combo
gulp.task( 'seajscombo', function(){
  return gulp.src( 'public/js/main.js')
      .pipe( seajsCombo())
      //生成合并的文件
      .pipe( gulp.dest('public/dist'));
}); 

//使用gulp-handlebars 和 gulp-seajs-combo 插件
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
        .pipe( gulp.dest('public/dist') );
});


