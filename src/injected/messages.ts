export type DiscordMessage =
  | { type: "startScreenShare"; screenIndex?: number }
  | { type: "stopScreenShare" }
  | { type: "toggleMicrophone" }
  | { type: "muteMicrophone" }
  | { type: "unmuteMicrophone" }
  | { type: "toggleSpeaker" }
  | { type: "deafen" }
  | { type: "undeafen" }
  | { type: "getVoiceMembers" };

export type VoiceMember = {
  name: string;
  avatarUrl?: string;
};

export type VoiceChannelState = {
  channel: string;
  members: VoiceMember[];
};
