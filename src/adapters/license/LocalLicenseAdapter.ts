import type { LicensePort } from '../../application/ports/LicensePort';
import type { ConfigPort } from '../../application/ports/ConfigPort';
import type { LicenseStatus, ProFeatureId } from '../../domain/models/License';

const KEY_PATTERN = /^VE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export class LocalLicenseAdapter implements LicensePort {
  constructor(private readonly config: ConfigPort) {}

  async getStatus(): Promise<LicenseStatus> {
    const settings = await this.config.getSettings();
    const key = settings.licenseKey || null;
    if (!key) {
      return { tier: 'free', licenseKey: null, validatedAt: null, errorMessage: null };
    }
    return this.validate(key);
  }

  async activate(licenseKey: string): Promise<LicenseStatus> {
    const status = this.validate(licenseKey);
    if (status.tier === 'pro') {
      await this.config.updateSettings({ licenseKey });
    }
    return status;
  }

  async deactivate(): Promise<LicenseStatus> {
    await this.config.updateSettings({ licenseKey: '' });
    return { tier: 'free', licenseKey: null, validatedAt: null, errorMessage: null };
  }

  async canUseFeature(_feature: ProFeatureId): Promise<boolean> {
    const status = await this.getStatus();
    if (status.tier === 'pro') return true;

    const settings = await this.config.getSettings();
    if (settings.proGraceDeadline > 0 && Date.now() < settings.proGraceDeadline) {
      return true;
    }
    return false;
  }

  private validate(key: string): LicenseStatus {
    if (!KEY_PATTERN.test(key)) {
      return {
        tier: 'free',
        licenseKey: key,
        validatedAt: null,
        errorMessage: 'invalid-format',
      };
    }

    const parts = key.replace('VE-', '').split('-');
    const body = parts.slice(0, 3).join('');
    const expected = this.computeChecksum(body);
    if (parts[3] !== expected) {
      return {
        tier: 'free',
        licenseKey: key,
        validatedAt: null,
        errorMessage: 'invalid-key',
      };
    }

    return {
      tier: 'pro',
      licenseKey: key,
      validatedAt: Date.now(),
      errorMessage: null,
    };
  }

  private computeChecksum(body: string): string {
    let hash = 0;
    for (let i = 0; i < body.length; i++) {
      hash = ((hash << 5) - hash + body.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
  }
}
