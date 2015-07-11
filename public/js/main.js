myLat = 40.7127;
myLng = -74.0059;
myUser = {}
myUserRef = null;
userMarkers = {};
trueLocation = false;


firebase = new Firebase("https://rak360.firebaseio.com/");
firebase.onAuth(authDataCallback);

var mapOptions = {
  center: { lat: myLat, lng: myLng},
  zoom: 15
};
var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);


google.maps.event.addListenerOnce(map, 'idle', function(){
	if (location.href.indexOf('browse') > 0 ){
		loadMapData();
	}
});

if (location.href.indexOf('watch') > 0){
	console.log('watch mode');
	watchTask();
}

if (location.href.indexOf('task') > 0){

}

setTimeout(function(){
	navigator.geolocation.getCurrentPosition(function(position){
		trueLocation = true;
		console.log('saving user geo position');
		myLat = position.coords.latitude;
		myLng = position.coords.longitude;
		console.log(myLat, myLng);
		if(myUserRef != null){
			myUserRef.update({
				lat: myLat,
				lng: myLng
			});
		}
	}, null, {timeout:10000});
}, 1000);

var showPosition = function(position) {

};




//////////////////////
//////Functions///////
//////////////////////


function authDataCallback(authData) {
  if (authData) {
  	userID = authData.uid;
	myUserRef = firebase.child('users').child(userID);
	myUserRef.on('value', function(snapshot){
		myUser = snapshot.val();
		console.log(myUser);
	});
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
  } else {
    console.log("User is logged out");
  }
}

function loadMapData(){
	firebase.child("tasks").on("child_added", function(snapshot) {
		task = snapshot.val();
		console.log(task);
		console.log(task.lat);
		console.log(task.lng);
		console.log('Adding marker');
		addIncidentMarker(task);
	});
}

function addIncidentMarker(task){
	latLng = new google.maps.LatLng(task.lat,task.lng);
	var marker = new google.maps.Marker({
		position: latLng,
		map: map,
		title: task.title
 	});
 	var infowindow = new google.maps.InfoWindow({
  			content: incidentString(task)
		});
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(map,marker);
	});
 	marker.setMap(map);
 	return marker;
}

function incidentString(task){
	var contentString = '<div class="media"><div class="media-left">';
 	contentString += '<img height="64" width="64" src="' + task.user.image + '" class="img-circle media-object">'
 	contentString += '</div><div class="media-body"><div class="media-heading">';
 	contentString += '<h4>' + task.title + '</h4>';
 	contentString += '<p>' + task.user.name + '</p>';
 	contentString += '<p>' + task.description + '</p>';
 	contentString += '</div></div>'
 	return contentString;
}

function markerFromUser(user){
	latLng = new google.maps.LatLng(user.lat,user.lng);
	var marker = new google.maps.Marker({
		position: latLng,
		map: map,
		title: user.name,
		icon: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
 	});
 	var infowindow = new google.maps.InfoWindow({
  			content: userString(user),
		});
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(map,marker);
	});
 	marker.setMap(map);
 	return marker;
}

function updateUserMarker(user, marker){
	//if(user.present != true){
	//	marker.setMap(null);
	//	return null;
	//}
	marker.setMap(map);
	marker.setPosition(new google.maps.LatLng(user.lat,user.lng));
	console.log('Moving marker');
}

function userString(user){
	var string = '<p>' + user.name + '<p>';
	string += '<img height="60" width="60" src="' + user.image + '" class="img-circle pull-left">';
}


function watchTask(){
	var href = location.href;
	var watchindex = href.indexOf('watch');
	var taskID = href.substring(watchindex+6, href.length);
	console.log(taskID);
	var incidentMarker = false;

	var taskRef = firebase.child('tasks').child(taskID);
	taskRef.on('value', function(snapshot){
		var task = snapshot.val();
		if(incidentMarker != false){
			incidentMarker.setPosition(new google.maps.LatLng(task.lat,task.lng));
		} else {
			addIncidentMarker(task);
		}
	});

	var usersRef = firebase.child('users');
	usersRef.on('value', function(snapshot){
		users = snapshot.val();
		console.log(users);
		for(var userID in users){
			user = users[userID];
			if (userMarkers[userID] == undefined){
				userMarkers[userID] = markerFromUser(user);
			}
			updateUserMarker(user, userMarkers[userID]);
		}
	});
}

function newTask(){
	if (myUser == {}){
		alert('You are not logged in!');
		return;
	}
	if (trueLocation == false){
		alert('We could not get your location info.');
		return;
	}
	var newTask = firebase.child('tasks').push({
		title: $("#title").val(),
		zip: $("#zip").val(),
		duraction: $("#duration").val(),
		description: $("#description").val(),
		lat: myLat,
		lng: myLng,
		user: myUser
	});
	var id = newTask.name();
	console.log(newTask);
	location.href = "watch/" + newTask.name()
}

function authFacebook(){
	firebase.authWithOAuthPopup("facebook", function(error, authData){
	  if (error) {
	    console.log("Login Failed!", error);
	  } else {
	    console.log("Authenticated successfully with payload:", authData);
	    myUserRef = firebase.child("users").child(authData.uid);
	    myUserRef.update({
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













