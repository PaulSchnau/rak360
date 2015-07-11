myLat = 40.7127;
myLng = -74.0059;

var firebase = new Firebase("https://rak360.firebaseio.com/");


function initialize() {
        var mapOptions = {
          center: { lat: myLat, lng: myLng},
          zoom: 12
        };
        var map = new google.maps.Map(document.getElementById('map-canvas'),
            mapOptions);
}
google.maps.event.addDomListener(window, 'load', initialize);



window.onload = function() {
  var startPos;
  var geoSuccess = function(position) {
  	myLat = position.coords.latitude;
  	myLng = position.coords.longitude;
    console.log(myLat);
    console.log(myLng);
  };
  navigator.geolocation.getCurrentPosition(geoSuccess);
};


firebase.child("tasks").on("value", function(snapshot) {
	console.log(snapshot.val());
});