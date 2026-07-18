import type { PreferencePort } from '../ports/PreferencePort';
import type { ClockPort } from '../ports/ClockPort';
import type { OrganizeVaultProposal } from '../../domain/models/OrganizeVaultPlan';
import type { PreferenceActionType } from '../../domain/models/PreferenceModels';
import { PreferenceExtractor } from '../../domain/services/PreferenceExtractor';

export class RecordPreferenceUseCase {
  constructor(
    private readonly preference: PreferencePort,
    private readonly clock: ClockPort,
  ) {}

  async execute(
    proposal: OrganizeVaultProposal,
    action: PreferenceActionType,
  ): Promise<void> {
    const signal = PreferenceExtractor.extractSignal(
      proposal,
      action,
      this.clock.now() as number,
    );
    await this.preference.recordSignal(signal);
  }
}
