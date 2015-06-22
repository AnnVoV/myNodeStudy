var model = {
  touristPlaces:[]
};

var controller = {
  initial:function(){
    //设置旅游列表
    //设置touristPlace数组
    this.setPlaceList();
  },  
  getPlaceList:function(){
    console.log('data： ',model.touristPlaces); 
    return model.touristPlaces;
  },
  setPlaceList:function(){
    model.touristPlaces = [
      {place:'台湾',price:'8000',status:'cloudy'},
      {place:'日本',price:'10000',status:'sunny'},
      {place:'美国',price:'15000',status:'cloudy'}
    ];
  }
};

//入口脚本
var main = function(){
  controller.initial();
};

main();

//返回旅游列表数据
exports.getPlaceList = function(){
  var arr = controller.getPlaceList();
  console.log(arr);
  return arr;
};