'use strict';
var Person = {
  name: '张三',
  //等同于birth: birth
  birth:'0423',
  // 等同于hello: function ()...
  hello() { console.log('我的名字是', this.name); }
};

module.exports = Person;