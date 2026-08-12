import type {
  HousingActionActor,
  HousingCapabilityBag,
  HousingPublisherProfile,
  HousingTenantModuleConfig,
  TenantConfiguration,
} from "@life-community-os/types";
import { CAPABILITIES } from "@/providers/TenantProvider";
import { getHousingModuleConfig } from "@/lib/housing/catalog";

export function resolveHousingCapabilityBag(hasCapability: (
  key: string,
) => boolean): HousingCapabilityBag {
  return {
    view: hasCapability(CAPABILITIES.housingView),
    createOwnListing: hasCapability(CAPABILITIES.housingCreateOwnListing),
    editOwnListing: hasCapability(CAPABILITIES.housingEditOwnListing),
    publisher: hasCapability(CAPABILITIES.housingPublisher),
    contact: hasCapability(CAPABILITIES.housingContact),
    save: hasCapability(CAPABILITIES.housingSave),
    manage: hasCapability(CAPABILITIES.housingManage),
  };
}

export function buildHousingActionActor(input: {
  personId: string;
  moduleEnabled: boolean;
  hasCapability: (key: string) => boolean;
  /** Preferred: TenantConfiguration from TenantProvider. */
  configuration?: TenantConfiguration;
  config?: HousingTenantModuleConfig;
  /**
   * Required for professional_created when tenant requires approval.
   * Fail closed if omitted under that policy.
   */
  professionalProfile?: HousingPublisherProfile | null;
}): HousingActionActor {
  return {
    personId: input.personId,
    moduleEnabled: input.moduleEnabled,
    caps: resolveHousingCapabilityBag(input.hasCapability),
    config: input.config ?? getHousingModuleConfig(input.configuration),
    professionalProfile: input.professionalProfile,
  };
}
