define(function(require,exports,module){
   var main2 = require('./main2'),
       resultstr = 'What the hell!'+ main2,
       dom = document.getElementById('result');

    dom.innerHTML = resultstr;
});


