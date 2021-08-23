var btnStartElement = document.getElementById('btn-start');
var btnJoinElement = document.getElementById('btn-join');
var remoteVideoElement = document.getElementById('remote-video');
var localVideoElement = document.getElementById('local-video');
var inputCreateLivestreamId = document.getElementById('create-livestream-id');
var inputJoinLivestreamId = document.getElementById('join-livestream-id');

var watcherListElement = document.getElementById('watcher-list');

var _isStarted = false;
var socket = io();

var iceServersConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
}

var localStream = null;
var remoteStream = null;

var streamRoomId = false;
var isRoomOwner = false;

var _debugWebRTC = false;
var _debugSocket = true;

var rctOfferOptions = {
  offerToReceiveVideo: true,
  offerToReceiveAudio: true,
};

var peerConnections = {
  local: {},
  remote: {},
};

btnStartElement.addEventListener('click', function () {
  if (streamRoomId) {
    socket.emit('livestream-stop', {id: streamRoomId});

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

    // remove all peers
    for (var pcType in peerConnections) {
      Object.keys(peerConnections[pcType]).forEach(function (id) {
        peerConnections[pcType][id].close();
      })
    }
    peerConnections = {
      local: {},
      remote: {},
    };

    watcherListElement.children.forEach(function () {
      watcherListElement.removeChild(this);
    });

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
  watcherListElement.style.display = 'block';
  
  btnJoinElement.disabled = true;
  inputJoinLivestreamId.disabled = true;

  socket.emit('livestream-start', {id: streamRoomId});

  start();
});

btnJoinElement.addEventListener('click', function () {
  if (streamRoomId) {
    socket.emit('livestream-leave', {id: streamRoomId});

    this.innerText = 'Join Livestream';

    remoteVideoElement.srcObject = null;
    localVideoElement.srcObject = null;

    btnStartElement.disabled = false;
    inputCreateLivestreamId.disabled = false;
    removeWatcher(socket.id);

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
  watcherListElement.style.display = 'none';

  socket.emit('livestream-join', {id: streamRoomId});
});

// regular events
socket.on('livestream-start-error', function (data) {
  _isStarted = false;
  streamRoomId = false;
  btnStartElement.innerText = 'Start';

  alert(data.error);
});

// owner events
socket.on('livestream-user-joined', function (data) {
  _logSocket('livestream-user-joined', data);

  var li = document.createElement('li');
  li.setAttribute('id', data.userId);
  li.innerText = data.userId;
  watcherListElement.appendChild(li);

  createWatcher(data.userId);
});
socket.on('livestream-user-leaved', function (id) {
  if (!id) {
    return;
  }

  var liElement = document.getElementById(id);
  if (liElement) {
    watcherListElement.removeChild(liElement);
  }

  removeWatcher(id);
});

socket.on('webrtc-host-offer', function (data) {
  var remoteConnection = new RTCPeerConnection(iceServersConfig);
  remoteConnection.ontrack = function (event) {
    remoteVideoElement.srcObject = event.streams[0];
    remoteVideoElement.play();
  };

  remoteConnection.setRemoteDescription(new RTCSessionDescription({
    type: data.type,
    sdp: decodeURIComponent(data.sdp),
  }));
  remoteConnection.createAnswer(rctOfferOptions)
    .then(function (description) {
      remoteConnection.setLocalDescription(description);

      socket.emit('webrtc-host-remote-answer', streamRoomId, {
        type: description.type,
        sdp: encodeURIComponent(description.sdp),
      });
    });

  peerConnections.remote[socket.id] = remoteConnection;
});
socket.on('webrtc-host-candidate', function (data) {
  var candidate = new RTCIceCandidate({
    type: data.type,
    sdpMLineIndex: data.sdpMLineIndex,
    candidate: decodeURIComponent(data.candidate),
  });
  peerConnections.remote[socket.id].addIceCandidate(candidate);
});
socket.on('webrtc-host-remote-answer', function (data) {
  peerConnections.local[socket.id].setRemoteDescription(new RTCSessionDescription({
    type: data.type,
    sdp: decodeURIComponent(data.sdp),
  }));
});

// watcher events
socket.on('webrtc-watcher-offer', function (data) {
  _logSocket('webrtc-watcher-offer', data);
  var remoteConnection = new RTCPeerConnection(iceServersConfig);
  remoteConnection.ontrack = function (event) {
    remoteVideoElement.srcObject = event.streams[0];
    remoteVideoElement.play();
  };

  remoteConnection.setRemoteDescription(new RTCSessionDescription({
    type: data.type,
    sdp: decodeURIComponent(data.sdp),
  }));
  remoteConnection.createAnswer(rctOfferOptions)
    .then(function (description) {
      remoteConnection.setLocalDescription(description);

      socket.emit('webrtc-watcher-remote-answer', streamRoomId, {
        type: description.type,
        sdp: encodeURIComponent(description.sdp),
      });
    });

  peerConnections.remote[socket.id] = remoteConnection;
  console.log(peerConnections);
});
socket.on('webrtc-watcher-candidate', function (data) {
  console.log('webrtc-watcher-candidate', data);
  console.log(peerConnections);
  var candidate = new RTCIceCandidate({
    type: data.type,
    sdpMLineIndex: data.sdpMLineIndex,
    candidate: decodeURIComponent(data.candidate),
  });
  peerConnections.remote[socket.id].addIceCandidate(candidate);
});

socket.on('webrtc-watcher-remote-answer', function (id, data) {
  peerConnections.local[id].setRemoteDescription(new RTCSessionDescription({
    type: data.type,
    sdp: decodeURIComponent(data.sdp),
  }));
});

function createWatcher(id) {
  var peerConnection = new RTCPeerConnection(iceServersConfig);
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit('webrtc-watcher-candidate', streamRoomId, id, {
        type: event.candidate.type,
        candidate: encodeURIComponent(event.candidate.candidate),
        sdpMLineIndex: event.candidate.sdpMLineIndex,
      });
    }
  };
  peerConnection.addStream(localStream);
  peerConnection.createOffer(rctOfferOptions)
    .then(function (description) {
      peerConnection.setLocalDescription(description);

      socket.emit('webrtc-watcher-offer', streamRoomId, id, {
        type: description.type,
        sdp: encodeURIComponent(description.sdp),
      });
    });

  peerConnections.local[id] = peerConnection;
}

function removeWatcher(id) {
  if (peerConnections.remote[id]) {
    peerConnections.remote[id].close();
    delete peerConnections.remote[id];
  }

  if (peerConnections.local[id]) {
    peerConnections.local[id].close();
    delete peerConnections.local[id];
  }
}

function createHost() {
  var peerConnection = new RTCPeerConnection(iceServersConfig);
  peerConnection.onicecandidate = function (event) {
    if (event.candidate) {
      socket.emit('webrtc-host-candidate', streamRoomId, {
        type: event.candidate.type,
        candidate: encodeURIComponent(event.candidate.candidate),
        sdpMLineIndex: event.candidate.sdpMLineIndex,
      });
    }
  };

  peerConnection.addStream(localStream);
  peerConnection.createOffer(rctOfferOptions)
    .then(function (description) {
      peerConnection.setLocalDescription(description);

      socket.emit('webrtc-host-offer', streamRoomId, {
        type: description.type,
        sdp: encodeURIComponent(description.sdp),
      });
    });

  peerConnections.local[socket.id] = peerConnection;
}

function start() {
  navigator.getUserMedia({video: true, audio: false}, function (stream) {
    localVideoElement.srcObject = stream;
    localVideoElement.play();

    localStream = stream;
    createHost();
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
