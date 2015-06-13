var gulp = require('gulp'),
    handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    seajsCombo = require( 'gulp-seajs-combo' );


//合并seajscombo 文件
gulp.task( 'seajscombo', function(){
  return gulp.src( 'public/js/main.js')
      .pipe( seajsCombo())
      //生成合并的文件
      .pipe( gulp.dest('public/dist'));
}); 

