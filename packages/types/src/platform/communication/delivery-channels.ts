/**
 * Delivery channel contracts (Phase 2.1).
 *
 * Communication Core owns Conversation + Message.
 * Delivery adapters (in-app, push, email, SMS, WhatsApp) are optional channels.
 * WhatsApp is NEVER the communication model — only a future delivery bridge.
 */

export const DELIVERY_CHANNEL_KINDS = [
  "in_app",
  "push",
  "email",
  "sms",
  "whatsapp",
] as const;

export type DeliveryChannelKind = (typeof DELIVERY_CHANNEL_KINDS)[number];

/**
 * Future delivery adapter port.
 * Implementations live outside Communication Core (integrations / automation).
 */
export type DeliveryChannelAdapter = {
  readonly channel: DeliveryChannelKind;
  /** Whether this channel may be offered for a tenant. */
  isAvailable(): boolean;
};

export function isDeliveryChannelKind(
  value: string,
): value is DeliveryChannelKind {
  return (DELIVERY_CHANNEL_KINDS as readonly string[]).includes(value);
}

/**
 * Architecture:
 * Communication Core → events → Notification / Delivery adapters
 * → in_app | push | email | sms | whatsapp
 */
export const COMMUNICATION_DELIVERY_ARCHITECTURE_NOTE =
  "WhatsApp is a delivery channel, not the Communication System of record.";
