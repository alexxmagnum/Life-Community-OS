import type { DomainId } from "./ids";

/**
 * Prepared diffusion stages for structured publication (Phase 1 foundation).
 * Not an intelligent routing engine — policy shape only (ADR-035 follow-up).
 */
export type DiffusionStageLevel = "micro_area" | "interest_group" | "territory";

export type DiffusionStage = {
  level: DiffusionStageLevel;
  /** Community Area id when level is micro_area. */
  communityAreaId?: DomainId;
  /** Community Group id when level is interest_group. */
  groupId?: DomainId;
  /** Channel id when diffusion targets a channel audience. */
  channelId?: DomainId;
};

export type DiffusionPolicy = {
  stages: DiffusionStage[];
};
