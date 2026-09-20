export type DiscordMessage =
  | { type: "startScreenShare"; screenIndex?: number }
  | { type: "stopScreenShare" }
  | { type: "toggleMicrophone" }
  | { type: "setMicrophoneOn" }
  | { type: "setMicrophoneOff" }
  | { type: "toggleSpeaker" }
  | { type: "setSpeakerOn" }
  | { type: "setSpeakerOff" }
  | { type: "getVoiceMembers" };

export type VoiceMember = {
  name: string;
  avatarUrl?: string;
};

export type VoiceChannelState = {
  channel: string;
  members: VoiceMember[];
};
