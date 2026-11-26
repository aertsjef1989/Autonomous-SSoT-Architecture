/**
 * Retrieval Demo Slot Interface (Decision X9 / Section J3):
 * Default is `no` (disabled) so zero embedding or vector queries run in the default unlisted build.
 * Keeping this typed slot allows attaching pgvector (`match_knowledge` in supabase/schema.sql) later by config alone.
 */

export interface RetrievedChunk {
  id: string;
  sourceTitle: string;
  marketCode: string | null;
  isStale: boolean;
  chunkText: string;
  similarity: number;
}

export interface RetrievalSlot {
  readonly enabled: boolean;
  retrieveContext(query: string, pillar: 'ssot' | 'prospecthub' | 'syndicate', topK?: number): Promise<RetrievedChunk[]>;
}

export const defaultRetrievalSlot: RetrievalSlot = {
  get enabled() {
    return process.env.ENABLE_RETRIEVAL_SLOT === '1';
  },
  async retrieveContext() {
    // Decision X9: disabled by default; returns empty array with zero network or DB calls.
    return [];
  },
};
