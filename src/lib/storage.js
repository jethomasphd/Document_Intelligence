import { get, set, del, keys } from 'idb-keyval';

const CORPUS_PREFIX = 'corpus:';
const META_PREFIX = 'corpusmeta:';
const CANDIDATE_PREFIX = 'candidates:';

// Embeddings are stored as Float32Array — IndexedDB's structured clone handles
// typed arrays natively, so saves and loads involve no encoding at all. Older
// corpora stored embeddings as base64 strings (marked _embEncoded); those are
// decoded on read and upgraded to the typed format the next time they're saved.

function toTypedEmbeddings(documents) {
  let changed = false;
  const result = documents.map((doc) => {
    if (Array.isArray(doc.embedding)) {
      changed = true;
      return { ...doc, embedding: Float32Array.from(doc.embedding) };
    }
    return doc;
  });
  return changed ? result : documents;
}

function decodeBase64Embedding(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Float32Array(bytes.buffer);
}

function decodeEmbeddings(documents) {
  return documents.map((doc) => {
    if (doc._embEncoded && typeof doc.embedding === 'string') {
      const { _embEncoded, ...rest } = doc;
      return { ...rest, embedding: decodeBase64Embedding(doc.embedding) };
    }
    if (Array.isArray(doc.embedding)) {
      return { ...doc, embedding: Float32Array.from(doc.embedding) };
    }
    return doc;
  });
}

function corpusMeta(corpus) {
  return {
    id: corpus.id,
    name: corpus.name,
    domain: corpus.domain,
    docCount: corpus.documents?.length || 0,
    categories: corpus.categories,
    embeddingModel: corpus.embeddingModel,
    createdAt: corpus.createdAt,
    updatedAt: corpus.updatedAt,
  };
}

export async function saveCorpus(corpus) {
  const toStore = {
    ...corpus,
    documents: toTypedEmbeddings(corpus.documents),
    updatedAt: Date.now(),
  };
  await set(CORPUS_PREFIX + corpus.id, toStore);
  // Lightweight companion record so listing corpora never loads full documents.
  await set(META_PREFIX + corpus.id, corpusMeta(toStore));
}

export async function getCorpus(id) {
  const corpus = await get(CORPUS_PREFIX + id);
  if (!corpus) return null;
  return {
    ...corpus,
    documents: decodeEmbeddings(corpus.documents),
  };
}

export async function listCorpora() {
  const allKeys = (await keys()).filter((k) => typeof k === 'string');
  const metaIds = new Set(
    allKeys.filter((k) => k.startsWith(META_PREFIX)).map((k) => k.slice(META_PREFIX.length))
  );
  const corpusIds = allKeys
    .filter((k) => k.startsWith(CORPUS_PREFIX))
    .map((k) => k.slice(CORPUS_PREFIX.length));

  const corpora = [];
  for (const id of corpusIds) {
    if (metaIds.has(id)) {
      const meta = await get(META_PREFIX + id);
      if (meta) {
        corpora.push(meta);
        continue;
      }
    }
    // Corpus saved before meta records existed: derive the meta from the full
    // record once and backfill so future listings stay cheap.
    const corpus = await get(CORPUS_PREFIX + id);
    if (!corpus) continue;
    const meta = corpusMeta(corpus);
    corpora.push(meta);
    set(META_PREFIX + id, meta).catch(() => {});
  }

  corpora.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return corpora;
}

export async function deleteCorpus(id) {
  await del(CORPUS_PREFIX + id);
  await del(META_PREFIX + id);
  await del(CANDIDATE_PREFIX + id);
}

export async function saveCandidate(candidate) {
  const key = CANDIDATE_PREFIX + candidate.corpusId;
  const existing = (await get(key)) || [];
  existing.push(candidate);
  await set(key, existing);
}

export async function getCandidates(corpusId) {
  return (await get(CANDIDATE_PREFIX + corpusId)) || [];
}
