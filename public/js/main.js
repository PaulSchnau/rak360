myLat = 40.7127;
myLng = -74.0059;
myUser = {}

var firebase = new Firebase("https://rak360.firebaseio.com/");
firebase.onAuth(authDataCallback);

function authDataCallback(authData) {
  if (authData) {
  	userID = authData.uid;
	var myUserRef = firebase.child('users').child(userID);
	myUserRef.on('value', function(snapshot){
		myUser = snapshot.val();
		console.log(myUser);
	})
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
  } else {
    console.log("User is logged out");
  }
}


var mapOptions = {
  center: { lat: myLat, lng: myLng},
  zoom: 12
};
var map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);



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


google.maps.event.addListenerOnce(map, 'idle', function(){
	loadData();
});

function loadData(){
	firebase.child("tasks").on("child_added", function(snapshot) {
		task = snapshot.val();
		console.log(task);
		console.log(task.lat);
		console.log(task.lng);
		console.log('Adding marker');
		latLng = new google.maps.LatLng(task.lat,task.lng);
		var marker = new google.maps.Marker({
			position: latLng,
			map: map,
			title: task.title
	 	});
	 	var contentString = '<div class="pull-right">';
	 	contentString += '<h5>' + task.title + '</h5>';
	 	contentString += '<p>' + task.user.name + '</p>';
	 	contentString += '</div>';

	 	contentString += '<div class="pull-left">';
	 	contentString += '<img height="60" width="60" src="http://i.imgur.com/ejLNaAh.jpg" class="img-circle pull-left">'
	 	contentString += '</div>';
	 	contentString += '<p>' + task.description + '</p>'

	 	var infowindow = new google.maps.InfoWindow({
      		content: contentString
  		});
  		google.maps.event.addListener(marker, 'click', function() {
    		infowindow.open(map,marker);
  		});

	 	marker.setMap(map);
	});
}

function newTask(){
	firebase.child('tasks').push({
		title: $("#title").val(),
		zip: $("#zip").val(),
		duraction: $("#duration").val(),
		lat: myLat,
		lng: myLng,
		user: myUser
	});
}

function authFacebook(){
	firebase.authWithOAuthPopup("facebook", function(error, authData){
	  if (error) {
	    console.log("Login Failed!", error);
	  } else {
	    console.log("Authenticated successfully with payload:", authData);
	    firebase.child("users").child(authData.uid).set({
      		provider: authData.provider,
      		name: getName(authData),
      		image: authData.facebook.profileImageURL
    	});
    	location.href = "/browse";
	  }
	}, {scope: "email,user_likes"});
}



function getName(authData) {
  switch(authData.provider) {
     case 'password':
       return authData.password.email.replace(/@.*/, '');
     case 'twitter':
       return authData.twitter.displayName;
     case 'facebook':
       return authData.facebook.displayName;
  }
}
