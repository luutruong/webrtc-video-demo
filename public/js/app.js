var btnStartElement = document.getElementById('btn-start');
var btnJoinElement = document.getElementById('btn-join');
var remoteVideoElement = document.getElementById('remote-video');
var localVideoElement = document.getElementById('local-video');
var inputCreateLivestreamId = document.getElementById('create-livestream-id');
var inputJoinLivestreamId = document.getElementById('join-livestream-id');

var _isStarted = false;
var socket = io();

var iceServersConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
}

// var localPeerConnection = null;
// var remotePeerConnection = null;

var localStream = null;
var remoteStream = null;

var streamRoomId = false;
var isRoomOwner = false;

var localConnections = {};
var remoteConnections = {};

var _debugWebRTC = false;
var _debugSocket = true;

btnStartElement.addEventListener('click', function () {
  if (streamRoomId) {
    emit('livestream-stop', {id: streamRoomId});

    btnStartElement.innerText = 'Start';

    localVideoElement.srcObject = null;
    remoteVideoElement.srcObject = null;

    localStream.getTracks().forEach(function (track) {
      track.stop();
    });
    localStream = null;
    streamRoomId = false;
    isRoomOwner = false;

    btnJoinElement.disabled = false;
    inputJoinLivestreamId.disabled = false;

    return;
  }

  var id = inputCreateLivestreamId.value.replace(/[^a-z0-9]+/gi, '');
  if (!id.length) {
    alert('Please enter valid ID');
    return;
  }

  streamRoomId = id;
  isRoomOwner = true;
  this.innerText = 'Stop';
  
  btnJoinElement.disabled = true;
  inputJoinLivestreamId.disabled = true;

  emit('livestream-start', {id: streamRoomId});

  start();
});

btnJoinElement.addEventListener('click', function () {
  if (streamRoomId) {
    emit('livestream-leave', {id: streamRoomId});

    this.innerText = 'Join Livestream';

    remoteVideoElement.srcObject = null;
    localVideoElement.srcObject = null;

    btnStartElement.disabled = false;
    inputCreateLivestreamId.disabled = false;

    streamRoomId = false;

    return;
  }

  var id = inputJoinLivestreamId.value.replace(/[^a-z0-9]+/gi, '');
  if (!id.length) {
    alert('Please enter valid ID');
    return;
  }

  streamRoomId = id;
  this.innerText = 'Leave';

  btnStartElement.disabled = true;
  inputCreateLivestreamId.disabled = true;

  emit('livestream-join', {id: streamRoomId});
});

// regular events
socket.on('livestream-start-error', function (data) {
  alert(data.error);
});

// owner events
socket.on('livestream-user-joined', function (data) {
  _logSocket('livestream-user-joined', data);

  createLocalPeerConnection(data.userId);
});

// event from localPeerConnection
socket.on('webrtc-remote-offer', function (data) {
  _logSocket('webrtc-remote-offer', data);
  var obj = Object.assign({}, data);
  if (!isRoomOwner) {
    delete obj.userId;
  }

  createRemotePeerConnection(obj);
});

socket.on('webrtc-remote-candidate', function (data) {
  _logSocket('webrtc-remote-candidate', data);
  var candidate = new RTCIceCandidate({
    candidate: decodeURIComponent(data.candidate),
    sdpMLineIndex: data.sdpMLineIndex,
  });

  remoteConnections[data.userId].addIceCandidate(candidate);
});

// event from remotePeerConnection
socket.on('webrtc-remote-answered', function (data) {
  _logSocket('webrtc-remote-answered', data);
  localConnections[data.userId].setRemoteDescription(new RTCSessionDescription({
    type: data.type,
    sdp: decodeURIComponent(data.sdp),
  }));
});

function emit(event, data) {
  _logSocket('socket.emit:', event, data);

  socket.emit(event, data);
}

function createLocalPeerConnection(userId) {
  var localPeerConnection = new RTCPeerConnection(iceServersConfig);
  localPeerConnection.onicecandidate = function (event) {
    if (!event.candidate) {
      return;
    }

    emit(userId ? 'webrtc-remote-candidate' : 'webrtc-local-candidate', {
      type: event.type,
      candidate: encodeURIComponent(event.candidate.candidate),
      sdpMLineIndex: event.candidate.sdpMLineIndex,
      roomId: streamRoomId,
    });
  };

  localPeerConnection.addStream(localStream);
  
  localPeerConnection.createOffer({offerToReceiveAudio: false, offerToReceiveVideo: true})
    .then(function (description) {
      localPeerConnection.setLocalDescription(description);

      _logWebRTC('localPeerConnection offered', description);
      emit('webrtc-local-offer', {
        type: description.type,
        sdp: encodeURIComponent(description.sdp),
        roomId: streamRoomId,
      });
    });

  localConnections[userId] = localPeerConnection;
}

function createRemotePeerConnection(data) {
  var remotePeerConnection = new RTCPeerConnection(iceServersConfig);
  remotePeerConnection.onicecandidate = function (event) {
    _logWebRTC('remotePeerConnection onicecandidate', event);
  };
  remotePeerConnection.setRemoteDescription(new RTCSessionDescription({
    sdp: decodeURIComponent(data.sdp),
    type: data.type,
  }));
  remotePeerConnection.createAnswer({
    offerToReceiveVideo: true,
    offerToReceiveAudio: false,
  })
  .then(function (description) {
    _logWebRTC('remote answered', description);
    remotePeerConnection.setLocalDescription(description);

    emit('webrtc-remote-answer', {
      type: description.type,
      sdp: encodeURIComponent(description.sdp),
      roomId: streamRoomId,
      userId: data.userId,
    });
  });

  remotePeerConnection.ontrack = function (event) {
    _logWebRTC('ontrack', event);

    remoteStream = event.streams[0];
    remoteVideoElement.srcObject = remoteStream;
    remoteVideoElement.play();
  };

  remoteConnections[data.userId] = remotePeerConnection;
}

function start() {
  navigator.getUserMedia({video: true, audio: false}, function (stream) {
    localVideoElement.srcObject = stream;
    localVideoElement.play();

    localStream = stream;

    createLocalPeerConnection(socket.id);
  }, function (err) {
    alert(err);
  });
}

function _logWebRTC(...args) {
  if (_debugWebRTC) {
    console.log.call(this, ...args);
  }
}

function _logSocket(...args) {
  if (_debugSocket) {
    console.log.call(this, ...args);
  }
}
