import type {
  HousingActionActor,
  HousingCapabilityBag,
  HousingTenantModuleConfig,
} from "@life-community-os/types";
import { CAPABILITIES } from "@/providers/TenantProvider";
import { getHousingModuleConfig } from "@/lib/housing/catalog";

export function resolveHousingCapabilityBag(hasCapability: (
  key: string,
) => boolean): HousingCapabilityBag {
  return {
    view: hasCapability(CAPABILITIES.housingView),
    createListing: hasCapability(CAPABILITIES.housingCreateListing),
    editListing: hasCapability(CAPABILITIES.housingEditListing),
    contact: hasCapability(CAPABILITIES.housingContact),
    save: hasCapability(CAPABILITIES.housingSave),
    manage: hasCapability(CAPABILITIES.housingManage),
  };
}

export function buildHousingActionActor(input: {
  personId: string;
  moduleEnabled: boolean;
  hasCapability: (key: string) => boolean;
  config?: HousingTenantModuleConfig;
}): HousingActionActor {
  return {
    personId: input.personId,
    moduleEnabled: input.moduleEnabled,
    caps: resolveHousingCapabilityBag(input.hasCapability),
    config: input.config ?? getHousingModuleConfig(),
  };
}
