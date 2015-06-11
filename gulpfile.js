var gulp = require('gulp'),
    stylus = require('gulp-stylus'),
    base64 = require('gulp-base64'),
    autoprefix = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css');

/*var template = require('gulp-template');*/
var versionId = new Date().getTime();

var paths = {
  stylus: ['stylus/**/*.styl'],
  imgs: ['stylus/sprites/*.png'],
  html: ['html/**/*.html']
};

var SCRIPT = "<!-- START NetEase Devilfish 2006 --> " +
"<script src=\"//analytics.163.com/ntes.js\" type=\"text/javascript\"></script> " +
"<script type=\"text/javascript\"> " +
"_ntes_nacc = \"loan\"; " +
"neteaseTracker(); " +
"</script> " +
"<!-- END NetEase Devilfish 2006 -->" +
"<script type=\"text/javascript\">" +
"var _gaq = _gaq || [];" +
"_gaq.push(['_setAccount', 'UA1431655066318'],['_setLocalGifPath', '/UA1431655066318/__utm.gif'],['_setLocalServerMode']);" +
"_gaq.push(['_addOrganic','baidu','word']);_gaq.push(['_addOrganic','soso','w']);_gaq.push(['_addOrganic','youdao','q']);" +
"_gaq.push(['_addOrganic','sogou','query']);_gaq.push(['_addOrganic','so.360.cn','q']);" +
"_gaq.push(['_trackPageview']);_gaq.push(['trackPageLoadTime']);" +
"(function() {" +
"var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;" +
"ga.src = '/ga.js';" +
"var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);" +
"})();" +
"</script>"

//imgs to sprite
/*gulp.task('sprite', function () {
  var spriteData = 
  gulp.src(paths.imgs)
  .pipe(spritesmith({
    imgName: '//i.epay.126.net/a/l/dist/css/i/sprite.png',
    cssName: 'sprite.styl'
  }));
  spriteData.img.pipe(gulp.dest('dist/css'));
  spriteData.css.pipe(gulp.dest('stylus/comm'));
});*/

//stylus to css
gulp.task('stylus', function() {
  return gulp.src(paths.stylus)
    .pipe(stylus())
    .pipe(autoprefix('last 2 versions'))
    //.pipe(minifycss({keepBreaks:true}))
    .pipe(minifycss())
    //.pipe(base64())
    .pipe(gulp.dest('public/css'));
});


//html version
/*gulp.task('tpl', function() {
  gulp.src(paths.html)
    .pipe(template({
      domain: '//i.epay.126.net/a/l',
      //domain: '//i.epay.126.net',
      version: versionId,
      analytics: SCRIPT
    }))
    .pipe(gulp.dest('/Users/ann/Documents/Netease/loanSvn/163pc'));
});*/

gulp.task('watch', function() {
  gulp.watch(paths.stylus, ['stylus']);
  gulp.watch(paths.img, ['sprite']);
  gulp.watch(paths.html, ['tpl']);
});


gulp.task('default', ['sprite','stylus','tpl']);