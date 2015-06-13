define('main2',function(require,exports,module){
  return " I know it's the fact!";
});
define('main',['main2'],function(require,exports,module){
   var main2 = require('main2'),
       resultstr = 'What the hell!'+ main2,
       dom = document.getElementById('result');

    dom.innerHTML = resultstr;
});



