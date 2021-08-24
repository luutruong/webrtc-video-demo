var remoteVideoElement = document.getElementById('remote-video');

var btnRegister = document.getElementById('btn-register');
var inputName = document.getElementById('input-name');

var inputCallName = document.getElementById('input-call-name');
var btnCall = document.getElementById('btn-call');
var btnStop = document.getElementById('btn-stop');
inputCallName.disabled = true;
btnCall.disabled = true;
btnStop.disabled = true;

var socket = io();
var localStream = null;
var callRoomId = null;

var localPeerConnection = null;
var remotePeerConnection = null;

var mediaConstraints = {
  audio: true,
  video: {
    aspectRatio: {
      ideal: 1.33333,
    },
  },
};

var rctOffer = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};
var iceServersConfig = {
  iceServers: [
    {
      urls: ['stun:stun.l.google.com:19302'],
    },
  ],
};

btnRegister.addEventListener(
  'click',
  function () {
    var name = inputName.value.replace(/(^\s*|\s*$)/g, '');

    if (!name.length) {
      alert('Please enter valid name');
      return;
    }

    socket.emit('set-name', name);
  },
  false
);
btnCall.addEventListener(
  'click',
  function () {
    var callee = inputCallName.value.replace(/(^\s*|\s*$)/g, '');
    if (!callee.length) {
      alert('Please enter valid participant name');
      return;
    }

    btnStop.disabled = true;

    socket.emit('video-call-to', callee);
    this.disabled = true;
    this.innerText = 'Calling...';
  },
  false
);
btnStop.addEventListener(
  'click',
  function () {
    socket.emit('video-call-end', callRoomId);

    closeVideoCall();
  },
  false
);

// SOCKETS
socket.on('set-name-error', function (err) {
  alert(err);
});
socket.on('set-name-ok', function () {
  inputName.disabled = true;
  btnRegister.disabled = true;

  btnCall.disabled = false;
  inputCallName.disabled = false;
});

socket.on('video-call-to-confirm', function (caller, roomId) {
  console.log('video-call-to-confirm', caller);
  var element = document.getElementsByClassName('calling')[0];
  element.style.display = 'block';
  var text = element.getElementsByClassName('calling-text')[0];
  text.innerText = caller.name + ' calling...';

  var btnAccept = element.getElementsByClassName('calling-accept')[0];
  var btnDeny = element.getElementsByClassName('calling-deny')[0];

  btnStop.disabled = true;

  btnAccept.addEventListener(
    'click',
    function () {
      element.style.display = 'none';

      callRoomId = roomId;
      socket.emit('video-call-accept', roomId);

      btnStop.disabled = false;

      setupLocalConnection();
    },
    false
  );

  btnDeny.addEventListener(
    'click',
    function () {
      element.style.display = 'none';
      socket.emit('video-call-deny', roomId);
    },
    false
  );
});

socket.on('video-call-user-accepted', function (callee, roomId) {
  console.log('video-call-user-accepted', callee, roomId);
  btnStop.disabled = false;

  callRoomId = roomId;
  // create host
  setupLocalConnection(socket.id);
});
socket.on('video-call-user-denied', function () {
  btnCall.disabled = false;
  btnCall.innerText = 'Call';
});

socket.on('video-call-ended', function () {
  console.log('video-call-ended');
  callRoomId = null;
  closeVideoCall();
});

socket.on('video-call-to-error', function (err) {
  btnCall.disabled = false;
  btnCall.innerText = 'Call';
  alert(err);
});

// WebRTC events
socket.on('video-call-local-offer', function (offer, senderId) {
  console.log('video-call-local-offer:\n', offer, '\n', 'senderId', senderId, 'currentUserId', socket.id);
  if (remotePeerConnection) {
    console.log(' -> already created connection');
    return;
  }

  remotePeerConnection = new RTCPeerConnection(iceServersConfig);
  remotePeerConnection.onicecandidate = handleICECandidateEvent;
  remotePeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  remotePeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  remotePeerConnection.ontrack = function (event) {
    console.log('ontrack');
    remoteVideoElement.srcObject = event.streams[0];
  };

  console.log('peerConnection.signalingState', remotePeerConnection.signalingState);
  if (remotePeerConnection.signalingState !== 'stable') {
    return;
  }

  console.log('peerConnection.setRemoteDescription()');
  remotePeerConnection.setRemoteDescription(
    new RTCSessionDescription({
      type: 'offer',
      sdp: decodeURIComponent(offer.sdp),
    })
  );

  remotePeerConnection.createAnswer(rctOffer).then(function (description) {
    remotePeerConnection.setLocalDescription(description);
    console.log('send remote answer to others');
    socket.emit('video-call-remote-answer', callRoomId, {
      type: description.type,
      sdp: encodeURIComponent(description.sdp),
    });
  });
});
socket.on('video-call-local-candidate', function (data, senderId) {
  console.log('video-call-local-candidate\n', data, '\nsenderId', senderId, 'currentUserId', socket.id);
  var candidate = new RTCIceCandidate({
    candidate: decodeURIComponent(data.candidate),
    sdpMLineIndex: data.sdpMLineIndex,
  });

  remotePeerConnection.addIceCandidate(candidate);
});
socket.on('video-call-remote-answer', function (data, senderId) {
  console.log('video-call-remote-answer\n', data, '\n senderId', senderId, 'currentUserId', socket.id);
  localPeerConnection.setRemoteDescription(
    new RTCSessionDescription({
      type: data.type,
      sdp: decodeURIComponent(data.sdp),
    })
  );
});

function closeVideoCall() {
  callRoomId = null;

  localStream.getTracks().forEach(function (track) {
    track.stop();
  });
  localStream = null;

  localPeerConnection.onicecandidate = null;
  localPeerConnection.oniceconnectionstatechange = null;
  localPeerConnection.onsignalingstatechange = null;

  remotePeerConnection.onicecandidate = null;
  remotePeerConnection.oniceconnectionstatechange = null;
  remotePeerConnection.onsignalingstatechange = null;
  remotePeerConnection.ontrack = null;

  localPeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection.close();
  remotePeerConnection = null;

  remoteVideoElement.removeAttribute('srcObject');

  btnCall.disabled = false;
  btnCall.innerText = 'Call';

  btnStop.disabled = true;
}

function setupLocalConnection() {
  console.log('setupLocalConnection()');
  if (localPeerConnection) {
    console.log('  -> localPeerConnection already setup');
    return;
  }
  localPeerConnection = new RTCPeerConnection(iceServersConfig);

  localPeerConnection.onicecandidate = handleICECandidateEvent;
  localPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  localPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;

  navigator.mediaDevices.getUserMedia(mediaConstraints).then(function (stream) {
    localStream = stream;

    localPeerConnection.addStream(localStream);
    localPeerConnection.createOffer(rctOffer).then(function (description) {
      localPeerConnection.setLocalDescription(description);

      socket.emit('video-call-local-offer', callRoomId, {
        type: description.type,
        sdp: encodeURIComponent(description.sdp),
      });
    });
  });
}

function handleTrackEvent(event) {
  console.log('ontrack', event);
  remoteVideoElement.srcObject = event.streams[0];
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit('video-call-local-candidate', callRoomId, {
      type: 'new-ice-candidate',
      candidate: encodeURIComponent(event.candidate.candidate),
      sdpMLineIndex: event.candidate.sdpMLineIndex,
    });
  }
}

function handleICEConnectionStateChangeEvent(event) {
  switch (event.target.iceConnectionState) {
    case 'closed':
    case 'failed':
    case 'disconnected':
      closeVideoCall();
      break;
  }
}

function handleSignalingStateChangeEvent(event) {
  switch (event.target.signalingState) {
    case 'closed':
      closeVideoCall();
      break;
  }
}

(function () {
  var urlSearch = new URLSearchParams(document.location.search);
  var name = urlSearch.get('name') || '';
  if (name.length > 0) {
    inputName.value = name;
    btnRegister.click();
  }
})();
