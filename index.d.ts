export interface Room {
  id: string;
  users: string[];
  ownerUserId: string;
}

export interface User {
  id: string;
  name: string;
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
