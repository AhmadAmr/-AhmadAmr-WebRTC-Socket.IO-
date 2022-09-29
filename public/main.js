let localStream;
let remoteStream;
let peerConnection;
let isStarted = false;
let isChannelReady = false;
let socket = io.connect();
let localVideo  = document.querySelector('#localVideo');
let remoteVideo = document.querySelector('#remoteVideo');

window.room = prompt("Enter room name:");

let pcConfig = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
};

if (room !== '') {
    socket.emit('createOrJoin', room);
}

/// handel socket event /////

socket.on('message', function(message) {
    console.log('Client received message:', message);
    if (message === 'userMedia') 
    {
      maybeStart();
    } 
    else if (message.type === 'offer') 
    {
      if (!isStarted) maybeStart();
      
      peerConnection.setRemoteDescription(new RTCSessionDescription(message));
      doAnswer();
    } 
    else if (message.type === 'answer' && isStarted) 
    {
        peerConnection.setRemoteDescription(new RTCSessionDescription(message));
    } 
    else if (message.type === 'candidate' && isStarted) 
    {
        let candidate = new RTCIceCandidate({sdpMLineIndex: message.label,candidate: message.candidate});
        peerConnection.addIceCandidate(candidate);
    } 
    else if (message === 'bye' && isStarted) {
      handleRemoteHangup();
    }
});

  socket.on('join', function (room){
    isChannelReady = true;
  });
  
  socket.on('joined', function(room) {
    isChannelReady = true;
  });

socket.on('full', function(room) {
    alert('Room ' + room + ' is full');
});

////////////////////////////

let sendMessage = async (message) => {
    socket.emit('message', message,room);
}

let init = async ()=> {
    try 
    {
        localStream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        localVideo.srcObject = localStream;
        await maybeStart();
    }
    catch(error) 
    {
        alert('getUserMedia() error: ' + error.name);
    };
};

let maybeStart = async ()=>{
    if(isChannelReady){
        createPeerConnection()
        peerConnection.addStream(localStream);
        isStarted = true;
        await doCall();
    }
}

let createPeerConnection = ()=> {
    peerConnection = new RTCPeerConnection(pcConfig);
    peerConnection.onicecandidate = handleIceCandidate;
    peerConnection.onaddstream = handleRemoteStream;
    //peerConnection.onremovestream = handleRemoteStreamRemoved;
}

let doCall = async ()=> {
    let offer = await peerConnection.createOffer();
    await setLocalAndSendMessage(offer);
}

let doAnswer = async ()=> {
    let answer = await peerConnection.createAnswer();
    await setLocalAndSendMessage(answer);
}

let setLocalAndSendMessage = async (sessionDescription) => {
    await peerConnection.setLocalDescription(sessionDescription);
    await sendMessage(sessionDescription);
}

let handleIceCandidate =  async (event)=> {
    console.log("foo");
   if(event.candidate){
       await  sendMessage({
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate
        });
   }
}

let handleRemoteStream = (event) => {
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}

init();