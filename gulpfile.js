var gulp = require("gulp");
var traceur = require('gulp-traceur');

gulp.task("traceur", function(){
    return gulp.src('js/*.js')
        .pipe(traceur())
        .pipe(gulp.dest('es5'));
});

gulp.watch("es6/*.js", ["traceur"]);

