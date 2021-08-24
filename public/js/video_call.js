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
var callToUserId = null;

var peerConnection = null;
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
  offerToReceiveVideo: true
};
var iceServersConfig = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302"]
    }
  ]
}

btnRegister.addEventListener('click', function () {
  var name = inputName.value.replace(/(^\s*|\s*$)/g, '');

  if (!name.length) {
    alert('Please enter valid name');
    return;
  }

  socket.emit('set-name', name);
});
btnCall.addEventListener('click', function () {
  var callee = inputCallName.value.replace(/(^\s*|\s*$)/g, '');
  if (!callee.length) {
    alert('Please enter valid participant name');
    return;
  }

  btnStop.disabled = true;

  socket.emit('video-call-to', callee);
  this.disabled = true;
  this.innerText = 'Calling...';
});
btnStop.addEventListener('click', function () {
  console.log(callToUserId, socket.id);
  socket.emit('video-call-end', callToUserId);
  
  closeVideoCall();
});

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

socket.on('video-call-to-confirm', function (caller) {
  console.log('video-call-to-confirm', caller);
  var element = document.getElementsByClassName('calling')[0];
  element.style.display = 'block';
  var text = element.getElementsByClassName('calling-text')[0];
  text.innerText = caller.name + ' calling...';

  var btnAccept = element.getElementsByClassName('calling-accept')[0];
  var btnDeny = element.getElementsByClassName('calling-deny')[0];

  btnStop.disabled = true;

  btnAccept.addEventListener('click', function () {
    element.style.display = 'none';

    callToUserId = caller.id;
    socket.emit('video-call-accept', caller.id);

    btnStop.disabled = false;
  });

  btnDeny.addEventListener('click', function () {
    element.style.display = 'none';
    socket.emit('video-call-deny', caller.id);
  })
});

socket.on('video-call-user-accepted', function (callee) {
  if (callee.id === socket.id) {
    throw new Error('Same user');
  }

  btnStop.disabled = false;

  callToUserId = callee.id;
  setupConnection();
});
socket.on('video-call-user-denied', function (callee) {
  btnCall.disabled = false;
  btnCall.innerText = 'Call';
});

socket.on('video-call-ended', function () {
  console.log('video-call-ended');
  callToUserId = null;
  closeVideoCall();
});

socket.on('video-call-to-error', function (err) {
  btnCall.disabled = false;
  btnCall.innerText = 'Call';
  alert(err);
});

// WebRTC events
socket.on('video-call-local-offer', function (senderId, offer) {
  
});
socket.on('video-call-local-candidate', function (data) {
  
});
socket.on('video-call-remote-answer', function (answer) {
  
});

function closeVideoCall() {
  callToUserId = null;

  localStream.getTracks().forEach(function (track) {
    track.stop();
  });
  localStream = null;

  this.disabled = true;
  btnCall.disabled = false;
  btnCall.innerText = 'Call';
}

function setupConnection() {
  peerConnection = new RTCPeerConnection(iceServersConfig);

  peerConnection.onicecandidate = handleICECandidateEvent;
  peerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
  peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
  peerConnection.ontrack = handleTrackEvent;

  peerConnection.createOffer(rctOffer)
    .then(function (description) {
      peerConnection.setLocalDescription(description);

      socket.emit('video-call-local-offer', callToUserId, {
        type: 'video-offer',
        sdp: encodeURIComponent(description.sdp),
      });
    });
}

function handleTrackEvent(event) {
  remoteVideoElement.srcObject = event.streams[0];
}

function handleICECandidateEvent(event) {
  if (event.candidate) {
    socket.emit('video-call-local-candidate', callToUserId, {
      type: 'new-ice-candidate',
      candidate: encodeURIComponent(event.candidate.candidate),
      sdpMLineIndex: event.candidate.sdpMLineIndex,
    });
  }
}

function handleICEConnectionStateChangeEvent() {
  switch (peerConnection.iceConnectionState) {
    case 'closed':
    case 'failed':
    case 'disconnected':
      closeVideoCall();
      break;
  }
}

function handleSignalingStateChangeEvent() {
  switch (peerConnection.signalingState) {
    case 'closed':
      closeVideoCall();
      break;
  }
}