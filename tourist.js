  var touristData  = {
    minSize:1,
    maxSize:50,
    places:[
      {place:'台湾',price:'8000'},
      {place:'日本',price:'10000'},
      {place:'韩国',price:'4000'}
    ]
  };

  exports.getPlaces = function(){
    return touristData;
  };