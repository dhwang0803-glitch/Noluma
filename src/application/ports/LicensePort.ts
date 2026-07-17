import type { LicenseStatus, ProFeatureId } from '../../domain/models/License';

export interface LicensePort {
  getStatus(): Promise<LicenseStatus>;
  activate(licenseKey: string): Promise<LicenseStatus>;
  deactivate(): Promise<LicenseStatus>;
  canUseFeature(feature: ProFeatureId): Promise<boolean>;
}
