myLat = 40.7127;
myLng = -74.0059;
myUser = {}
myUserRef = null;
userMarkers = {};
trueLocation = false;
taskID = null;
taskRef = null;
taskSelected = null;
messagesRef = null;
reponderMarker = null;
responderMarker = null;

var noPoi = [
{
    featureType: "poi",
    stylers: [
      { visibility: "off" }
    ]   
  }
];




firebase = new Firebase("https://rak360.firebaseio.com/");
firebase.onAuth(authDataCallback);

function loadMap(){
	var mapOptions = {
	  center: { lat: myLat, lng: myLng},
	  zoom: 10,
	  disableDefaultUI: true, // a way to quickly hide all controls
	    mapTypeControl: true,
	    scaleControl: true,
	    zoomControl: true,
	    mapTypeId: google.maps.MapTypeId.ROADMAP,
	    mapTypeControl: false
	  };
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	map.setOptions({styles: noPoi});

	google.maps.event.addListenerOnce(map, 'idle', function(){
		if (location.href.indexOf('browse') > 0 ){
			loadMapData();
		}
	});
}

if (location.href.indexOf('browse') > 0){
	loadMap();
}

if (location.href.indexOf('watch') > 0){
	loadMap();
	console.log('watch mode');
	watchTask();
}

if (location.href.indexOf('respond') > 0){
	loadMap();
	loadRespond();
}

function forwardFromHome(){
	if($("#youareonthehomepage").length == 1){
		location.href="/browse";
	}
}


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
		continuousPosition();
	});

function continuousPosition(){
	setInterval(function(){
		navigator.geolocation.getCurrentPosition(function(position){
			trueLocation = true;
			myLat = position.coords.latitude;
			myLng = position.coords.longitude;
			if(myUserRef != null){
				myUserRef.update({
					lat: myLat,
					lng: myLng
				});
			}
		}, null, {timeout:5000});
	}, 1000);
}


//////////////////////
//////Functions///////
//////////////////////


function authDataCallback(authData) {
  if (authData) {
  	userID = authData.uid;
	myUserRef = firebase.child('users').child(userID);
	myUserRef.on('value', function(snapshot){
		myUser = snapshot.val();
		myUser.id = snapshot.key();
		console.log(myUser);
	});
    console.log("User " + authData.uid + " is logged in with " + authData.provider);
    forwardFromHome();
  } else {
    console.log("User is logged out");
  }
}

function loadMapData(){
	var markers = [];
	var incidentBounds = new google.maps.LatLngBounds();
	firebase.child("tasks").on("child_added", function(snapshot, prevChildKey) {
		task = snapshot.val();
		task.id = snapshot.key();
		var newMarker = addIncidentMarker(task);
		markers.push(newMarker);
		for(i=0;i<markers.length;i++) {
			incidentBounds.extend(markers[i].getPosition());
		}
		map.fitBounds(incidentBounds);
		if (map.getZoom() > 15){
			map.setZoom(15);
		}
	});
}

function addIncidentMarker(task){
	latLng = new google.maps.LatLng(task.lat,task.lng);
	var marker = new google.maps.Marker({
		position: latLng,
		map: map,
		title: task.title,
		icon: 'http://maps.google.com/mapfiles/ms/icons/pink-dot.png'
 	});
 	var infowindow = new google.maps.InfoWindow({
  			content: incidentString(task)
		});
	google.maps.event.addListener(marker, 'click', function() {
		infowindow.open(map,marker);
		taskSelected = task;
		console.log(task);
    	map.setCenter(marker.getPosition());
	});

 	marker.setMap(map);
 	return marker;
}

function incidentString(task){
	var d = new Date();
	var now = d.getTime();
	var difference = now - task.created_at;
	var minutesAgo = Math.round(difference / 1000 / 60);
	var contentString = '<div class="media" style="max-width: 300px;"><div class="media-left">';
 	contentString += '<img height="64" width="64" src="' + task.user.image + '" class="img-circle media-object">'
 	contentString += '</div><div class="media-body"><div class="media-heading">';
 	contentString += '<h4>' + task.title + '</h4>';
 	contentString += '<p>' + task.user.name + ' - <small>'+ minutesAgo + ' minutes ago</small></p>';
 	contentString += '<p>' + task.duration + ' Minutes - ' + task.description + '</p>';
 	contentString += '</div></div>'
 	contentString += '<button class="btn btn-info" onClick="respond()">Response to Flare</button>'
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
	marker.setMap(map);
	marker.setPosition(new google.maps.LatLng(user.lat,user.lng));
}

function userString(user){
	var string = '<p><b>' + user.name + '</b></p>';
	string += '<img height="60" width="60" src="' + user.image + '" class="img-circle pull-left">';
	return string;
}


function watchTask(){
	var href = location.href;
	var watchindex = href.indexOf('watch');
	taskID = href.substring(watchindex+6, href.length);
	console.log(taskID);
	var incidentMarker = false;

	taskRef = firebase.child('tasks').child(taskID);
	taskRef.on('value', function(snapshot, prevChildKey){
		var task = snapshot.val();
		task.id = snapshot.key();
		console.log(task);
		if(incidentMarker != false){
			incidentMarker.setPosition(new google.maps.LatLng(task.lat,task.lng));
		} else {
			addIncidentMarker(task);
			map.setCenter(new google.maps.LatLng(task.lat,task.lng));
		}
		console.log(task.responder);
		if(task.responder != null){
			location.href = "/respond/" + task.id;
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
		//zip: $("#zip").val(),
		duration: $("#duration").val(),
		description: $("#description").val(),
		lat: myLat,
		lng: myLng,
		user: myUser,
		created_at: Firebase.ServerValue.TIMESTAMP
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

function authTwitter(){
	firebase.authWithOAuthPopup("twitter", function(error, authData){
	  if (error) {
	    console.log("Login Failed!", error);
	  } else {
	    console.log("Authenticated successfully with payload:", authData);
	    myUserRef = firebase.child("users").child(authData.uid);
	    myUserRef.update({
      		provider: authData.provider,
      		name: getName(authData),
      		image: authData.twitter.profileImageURL
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

function cancelTask(){
	taskRef.remove();
	location.href = '/browse';
}

function respond(){
	firebase.child('tasks').child(taskSelected.id).update({
		responder: myUser.id
	})
	location.href = "/respond/" + taskSelected.id;
}

function loadRespond(){
	var href = location.href;
	var watchindex = href.indexOf('respond');
	taskID = href.substring(watchindex+8, href.length);
	console.log(taskID);

	

	taskRef = firebase.child('tasks').child(taskID);
	taskRef.on('value', function(snapshot){
		var task = snapshot.val();
		if (task.user.name != myUser.name){
			$('#name').text(task.user.name);
			$('#image').attr("src", task.user.image);
		} else{
			responderRef = firebase.child('users').child(task.responder);
			responderRef.on('value', function(snapshot){
				var responder = snapshot.val();
				$('#name').text(responder.name);
				$('#image').attr("src", responder.image);
			})
		}

		$("#description").text(task.description);
		$("#time").text(task.duration + ' Minutes');
		watchBoth(task);
	});
	taskRef.update({response: true});

	messagesRef = taskRef.child('messages');
	messagesRef.on('child_added', function(snapshot){
		var message = snapshot.val();
		var html = '<div>' + message.name + ": " + message.text + "</div>";
		$("#chat").append(html);
		scrollChat();	
	});

}

function sendMessage(){
	var message = $('#message').val();
	if(message == '') return false;
	messagesRef.push({
		text: message,
		name: myUser.name
	})
	var message = $('#message').val('');
	scrollChat();
	return false;
}

function scrollChat(){
	var height = 0;
	$('#chat div').each(function(i, value){
	    height += parseInt($(this).height());
	});
	height += '';
	$('#chat').animate({scrollTop: height});
}

function watchBoth(task){
	needyMarker = markerFromUser(task.user);
	responderRef = firebase.child('users').child(task.responder);
	responderRef.on("value", function(snapshot){
		var responder = snapshot.val();
		if (reponderMarker == null){
			reponderMarker = markerFromUser(responder);
		} 
		updateUserMarker(responder, reponderMarker);
		responderLatLng = new google.maps.LatLng(responder.lat,responder.lng);
		needyLatLng = new google.maps.LatLng(task.user.lat,task.user.lng);
		distance = google.maps.geometry.spherical.computeDistanceBetween (responderLatLng, needyLatLng);
		miles = Math.round(distance / 1609 * 100) / 100;
		$("#miles").text(miles + ' Miles')
	});
	var bounds = new google.maps.LatLngBounds();
	map.setZoom(16);
	bounds.extend(needyMarker.getPosition());
	bounds.extend(reponderMarker.getPosition());
	map.fitBounds(bounds);
}

function logout(){
	firebase.unauth();
	location.href= "/";
}








