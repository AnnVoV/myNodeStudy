'use strict';
//遍历器返回的next方法必须返回一个包含value 和 done 两个属性的对象
//value 代表遍历器当前的位置的值
//done 代表遍历是否结束
function mymakeInterator(array){
  var nextIndex = 0;
  return {
    next:function(){
      return nextIndex<array.length?
        {value:nextIndex++,done:false}:
        {done:true}
    }
  }
};

var myIt = mymakeInterator(['a','b','c']);
console.log(myIt.next().value);
console.log(myIt.next().value);
console.log(myIt.next().value);

function* helloworldGenerator(){
  //yield 类似于return 语句
  yield 'hello';
  yield 'world';
}
var hw = helloworldGenerator();
//调用这个函数就会得到遍历器
console.log(hw.next());
console.log(hw.next());
console.log(hw.next());