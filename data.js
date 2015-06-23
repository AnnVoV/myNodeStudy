var model = {
  touristPlaces:[],
  detailList:{},
  touristList:[]
};

var controller = {
  initial:function(){
    //设置旅游列表
    //设置touristPlace数组
    this.setPlaceList();
    this.setTouristList();
  },  
  getPlaceList:function(){
    return model.touristPlaces;
  },
  getTouristList:function(){
    return model.touristList;
  },
  setPlaceList:function(){
    model.touristPlaces = [
      {place:'台湾',price:'8000',status:'cloudy'},
      {place:'日本',price:'10000',status:'sunny'},
      {place:'美国',price:'15000',status:'cloudy'}
    ];
    model.detailList = {
      '台湾':{title:'台湾',subtitle:'taiwan',status:'cloudy',intro:'I will go there next summer!Must Go!'},
      '日本':{title:'日本',subtitle:'japan',status:'sunny',intro:'I want to go to this clean place!'},
      '美国':{title:'美国',subtitle:'usa',status:'rainy',intro:'Forever No.1 in my heart!Love Love Love!'}
    };
  },
  setTouristList:function(){
    model.touristList = [
      {place:'台湾',href:'/tourPlace/台湾'},
      {place:'日本',href:'/tourPlace/日本'},
      {place:'美国',href:'/tourPlace/美国'}
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
  return arr;
};

//返回具体的景点信息列表
exports.getDetailList = function(){
  return model.detailList;
};

//返回已存在的景点列表
exports.getTouristList = function(){
  return model.touristList;
};