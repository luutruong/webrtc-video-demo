export interface Room {
  users: string[];
  ownerUserId: string;
}

export interface SocketEventWebRTCOffer extends WebRTCOffer {
  roomId: string;
  userId: string;
}

export interface SocketEventWebRTCCandidate extends WebRTCCandidate {
  roomId: string;
  userId: string;
}

export interface SocketEventWebRTCAnswer extends SocketEventWebRTCOffer {}

export interface WebRTCCandidate {
  sdpMLineIndex: number;
  candidate: string;
  type: string;
}

export interface WebRTCOffer {
  type: string;
  sdp: string;
}
