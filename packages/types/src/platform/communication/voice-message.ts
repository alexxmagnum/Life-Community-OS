/**
 * Voice message UX foundation (Phase 2.5.3).
 *
 * States for microphone UI — no audio storage / upload yet.
 */

export const VOICE_RECORDER_STATES = [
  "idle",
  "recording",
  "cancel_pending",
  "ready_to_send",
] as const;

export type VoiceRecorderState = (typeof VOICE_RECORDER_STATES)[number];

export function isVoiceRecorderState(
  value: string,
): value is VoiceRecorderState {
  return (VOICE_RECORDER_STATES as readonly string[]).includes(value);
}

export const VOICE_MESSAGE_FOUNDATION_NOTE =
  "Voice recorder UI is foundation only. Do not invent audio blobs or MessageMediaRef without Files + retention policy.";
