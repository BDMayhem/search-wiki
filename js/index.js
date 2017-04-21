//the initial background image is determined here 
var queryTerm = "sunrise";

$(document).ready(function(){
  getIDs();
})

//search wikipedia and display 10 results
function search() {
  $("#results").html("");
  $.ajax({
    url: "https://en.wikipedia.org/w/api.php?action=opensearch&format=json&namespace=0&limit=10&callback=?&search=" + queryTerm,
    dataType: "json",
    type: "POST",
    headers: {"Api-User-Agent": "BD's FCC Wiki Viewer"},
    success: function(a) {
      console.log(a);
      for (var i = 0; i < a[1].length; i++){
      $("#results").append("<div id='result'><a href='" + a[3][i] + "' target='blank'><h2>" + a[1][i] + "</h2></a><p>" + a[2][i] + "</p></div>")
      }
    }  
  })
}

//this is the search button being clicked
$("#search").click(function(e){
  e.preventDefault();
  //get the text user has typed in
  queryTerm = $("input").val();
  //get rid of that annoying border after you click the search button
  $("#search").on("mouseup", function(){
    this.blur();
  });
  //clear results from the previous search
  $("#results").html();
  //search wikipedia
  search();
  //find a new background on flickr
  getIDs();
})

var imgs = [];

//find 100 images on flickr based on what user searched
function getIDs (){
  imgs = [];
  var flickr = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=e1b01dd687635561457c31f4e649bf94&sort=interestingness-desc&text=" + queryTerm + "&format=json&nojsoncallback=1&per_page=100";
  $.ajax({
    url: flickr,
    success: function (a){
      for (var i = 0; i < a.photos.photo.length; i++){
        imgs.push(a.photos.photo[i].id);
      }
      getRatio();
    }
  })
}

var ratios = [];

//take the image ID for each image and hit flickr again to get image dimensions
function getRatio(){
  //clear previous search data
  ratios = [];
  for (var j = 0; j < imgs.length; j++){
    $.ajax({
      url: "https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=e1b01dd687635561457c31f4e649bf94&format=json&nojsoncallback=1&photo_id=" + imgs[j],
      success: function (b){
        //find the second biggest available size for each image
        var biggest = b.sizes.size.length - 2;
        //find size of user's window
        var screenRatio = $(window).height() / $(window).width();
        //find the difference between screen and image
        var diff = Math.abs(screenRatio - b.sizes.size[biggest].height / b.sizes.size[biggest].width);
        //save relevant info to an array
        ratios.push({
          url: b.sizes.size[biggest].source,
          difference: diff
        })
      }
    })
  }
  //give flickr a few milliseconds before we move on
  setTimeout(function() {
    compareRatios();
  }, 300)
}

//we're going to need a couple of prioritized arrays
var selects = [];
var backups = [];

//here's where we attempt to choose images as close to the screen ratio as possible
function compareRatios(){
  //clear previous search data
  selects = [];
  backups = [];
  //loop through all the images
  for (var k = 0; k < ratios.length; k++) {
    //these images are closest in aspect ratio to the window
    if (ratios[k].difference < 0.1) {
      selects.push(ratios[k]);
      backups.push(ratios[k]);
      //these images are sort of close
    } else if (ratios[k].difference < 0.3 && selects.length === 0) {
      backups.push(ratios[k]);
    }
  }
  chooseBG();
}

//here's where we choose the specific image and set it as the background image
function chooseBG() {
  var chosen;
  //if no images were even close enough to backup-worthy, sort them and choose the one with the closest aspect ratio
  if (selects.length === 0 && backups.length === 0) {
    function compare(a, b){
      if (a.difference < b.difference){
        return -1;
      }
      if (a.difference > b.difference){
        return 1;
      }
      return 0;
    }
    ratios.sort(compare);
    chosen = ratios[0].url;
  //if there aren't at least 3 selects to choose from, pick from backups
  } else if (selects.length < 3) {
    var rand = Math.floor(Math.random() * backups.length);
    chosen = backups[rand].url;
  //choose one of the selects
  } else {
    var rand = Math.floor(Math.random() * selects.length);
    chosen = selects[rand].url;
  }
  //set the chosen image as the background
  $("body").css("background-image", "url(" + chosen +")");
}