var gulp = require('gulp'),
    handlebars = require('gulp-handlebars'),
    wrap = require('gulp-wrap'),
    stylus = require('gulp-stylus'),
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
  return gulp.src( 'public/js/*.js' )
      .pipe( seajsCombo({
          //忽略对jquery 的处理
          ignore:['jquery'],
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
      .pipe(gulp.dest('public/dist'));
});

gulp.task('stylus',function(){
  return gulp.src('stylus/*.styl')
        .pipe(stylus())
        .pipe(gulp.dest('public/css'));
});

gulp.task('watch',function(){
  gulp.watch('public/js/*.js', ['seajscombohbs']);
  gulp.watch('stylus/*.styl', ['stylus']);
})

//Default gulp task to run
//seajscombohbs stylus 
gulp.task('default',['seajscombohbs','stylus']);


