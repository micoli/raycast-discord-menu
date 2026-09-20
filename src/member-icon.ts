import { Icon, Image } from "@raycast/api";
import type { VoiceMember } from "./injected/messages";

export const memberIcon = (member: VoiceMember): Image.ImageLike =>
  member.avatarUrl ? { source: member.avatarUrl, mask: Image.Mask.Circle } : Icon.Person;
