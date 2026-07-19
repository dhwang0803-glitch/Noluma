import type { RefactorGoal, RefactorCostEstimate, VaultMetadataSnapshot } from '../../domain/models/RefactorModels';
import {
  REFACTOR_BATCH_SIZE,
  REFACTOR_MAX_TAGS_IN_PROMPT,
  FLEETING_WORD_COUNT_THRESHOLD,
  FLEETING_MIN_CLUSTER_SIZE,
} from '../../constants';

const COST_PER_AI_CALL_USD = 0.012;
const SECONDS_PER_AI_CALL = 8;

export class EstimateRefactorCostUseCase {
  execute(goal: RefactorGoal, snapshot: VaultMetadataSnapshot): RefactorCostEstimate {
    switch (goal.goalType) {
      case 'reorganize-notes':
        return this.estimateReorganize(snapshot);
      case 'clean-up-tags':
        return this.estimateTagCleanup(snapshot);
      case 'suggest-links':
        return this.estimateLinkSuggestions(snapshot);
      case 'consolidate-fleeting':
        return this.estimateFleetingNotes(goal, snapshot);
    }
  }

  private estimateReorganize(snapshot: VaultMetadataSnapshot): RefactorCostEstimate {
    const orphanCount = snapshot.noteEntries.filter(
      n => n.backlinks.length === 0 && n.links.length === 0,
    ).length;
    const emptyCount = snapshot.noteEntries.filter(
      n => n.wordCount === 0 && n.backlinks.length === 0 && n.links.length > 0,
    ).length;
    const noteCount = orphanCount + emptyCount;
    const chunkCount = Math.ceil(orphanCount / REFACTOR_BATCH_SIZE);
    const analysisAICalls = chunkCount;
    const tier2AICalls = 1;
    const estimatedAICalls = analysisAICalls + tier2AICalls;

    return {
      estimatedAICalls,
      estimatedCostUsd: round(estimatedAICalls * COST_PER_AI_CALL_USD),
      estimatedDurationSeconds: estimatedAICalls * SECONDS_PER_AI_CALL,
      noteCount,
      chunkCount,
    };
  }

  private estimateTagCleanup(snapshot: VaultMetadataSnapshot): RefactorCostEstimate {
    const tagCount = snapshot.tagFrequencies.length;
    const untaggedCount = snapshot.noteEntries.filter(
      n => n.tags.filter(t => t !== '#untagged').length === 0 && n.wordCount > 0,
    ).length;
    const noteCount = snapshot.totalNotes;
    const tagChunkCount = Math.ceil(tagCount / REFACTOR_MAX_TAGS_IN_PROMPT);
    const untaggedChunkCount = Math.ceil(untaggedCount / REFACTOR_BATCH_SIZE);
    const synthesisAICalls = 1;
    const estimatedAICalls = tagChunkCount + synthesisAICalls + untaggedChunkCount;

    return {
      estimatedAICalls,
      estimatedCostUsd: round(estimatedAICalls * COST_PER_AI_CALL_USD),
      estimatedDurationSeconds: estimatedAICalls * SECONDS_PER_AI_CALL,
      noteCount,
      chunkCount: tagChunkCount + untaggedChunkCount,
      tagCount,
    };
  }

  private estimateLinkSuggestions(snapshot: VaultMetadataSnapshot): RefactorCostEstimate {
    const orphanCount = snapshot.noteEntries.filter(
      n => n.backlinks.length === 0 && n.links.length === 0,
    ).length;
    const chunkCount = Math.ceil(orphanCount / REFACTOR_BATCH_SIZE);
    const brokenLinkScanCalls = 1;
    const estimatedAICalls = chunkCount + brokenLinkScanCalls;

    return {
      estimatedAICalls,
      estimatedCostUsd: round(estimatedAICalls * COST_PER_AI_CALL_USD),
      estimatedDurationSeconds: estimatedAICalls * SECONDS_PER_AI_CALL,
      noteCount: orphanCount + snapshot.totalNotes,
      chunkCount,
    };
  }

  private estimateFleetingNotes(
    goal: RefactorGoal,
    snapshot: VaultMetadataSnapshot,
  ): RefactorCostEstimate {
    const threshold = goal.parameters.fleetingWordCountThreshold ?? FLEETING_WORD_COUNT_THRESHOLD;
    const candidates = snapshot.noteEntries.filter(
      n => n.wordCount < threshold && n.tags.length <= 1 && n.links.length <= 1,
    );
    const estimatedClusters = Math.max(1, Math.floor(candidates.length / FLEETING_MIN_CLUSTER_SIZE));
    const estimatedAICalls = estimatedClusters + 1;

    return {
      estimatedAICalls,
      estimatedCostUsd: round(estimatedAICalls * COST_PER_AI_CALL_USD),
      estimatedDurationSeconds: estimatedAICalls * SECONDS_PER_AI_CALL,
      noteCount: candidates.length,
      chunkCount: estimatedClusters,
    };
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
