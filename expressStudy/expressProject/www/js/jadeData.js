var infoList = [
  {title:'What the hell',author:'ann'},
  {title:'Love youself first',author:'ann'},
  {title:'Be youself',author:'amber'},
  {title:'Keep calm and carry on!',author:'super'}
];

var infoData = {};

exports.getInfoList = function(){
  return infoList;
};

exports.getListByIndex = function(index){
  return infoList[i];
};

exports.saveData = function(obj){
  for(key in obj){
    infoData[key] = obj;
  }
  console.log('infoData:');
  console.log(infoData);
}

exports.getDataByKey = function(key){
  return infoData[key];
}