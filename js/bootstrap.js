var System = require('es6-module-loader').System;

System.import('some-module').then(function(m) {
    //index.run(__dirname);
    console.log(m.p);
}).catch(function(err){
    //console.log('err', err);
});