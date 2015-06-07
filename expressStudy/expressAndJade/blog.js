var entries = [
  {"id":1, "title":"Hello World!", "body":"This is the body of my blog entry. Sooo exciting.", "published":"6/2/2013"},
  {"id":2,"title":"Love u self!","body":"Call me super Ann!","published":"6/3/2015"},
  {"id":3, "title":"I'm Leaving Technology X and You Care", "body":"Let me write some link bait about why I'm not using a particular technology anymore.", "published":"6/10/2013"}
];

exports.getBlogEntries = function(){
  return entries;
};

exports.getBlogEntry = function(id){
  for( var i=0;i<entries.length;i++ ){
    if( entries[i].id == id )
      return entries[i];
  }
};