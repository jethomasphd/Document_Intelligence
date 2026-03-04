import { get, set, del, keys } from 'idb-keyval';

const CORPUS_PREFIX = 'corpus:';
const CANDIDATE_PREFIX = 'candidates:';

function encodeEmbeddings(documents) {
  return documents.map((doc) => {
    if (doc.embedding && Array.isArray(doc.embedding)) {
      const f32 = new Float32Array(doc.embedding);
      const bytes = new Uint8Array(f32.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return { ...doc, embedding: btoa(binary), _embEncoded: true };
    }
    return doc;
  });
}

function decodeEmbeddings(documents) {
  return documents.map((doc) => {
    if (doc._embEncoded && typeof doc.embedding === 'string') {
      const binary = atob(doc.embedding);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const f32 = new Float32Array(bytes.buffer);
      const { _embEncoded, ...rest } = doc;
      return { ...rest, embedding: Array.from(f32) };
    }
    return doc;
  });
}

export async function saveCorpus(corpus) {
  const toStore = {
    ...corpus,
    documents: encodeEmbeddings(corpus.documents),
    updatedAt: Date.now(),
  };
  await set(CORPUS_PREFIX + corpus.id, toStore);
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
  const allKeys = await keys();
  const corpusKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(CORPUS_PREFIX));

  const corpora = [];
  for (const key of corpusKeys) {
    const corpus = await get(key);
    if (corpus) {
      corpora.push({
        id: corpus.id,
        name: corpus.name,
        domain: corpus.domain,
        docCount: corpus.documents?.length || 0,
        categories: corpus.categories,
        createdAt: corpus.createdAt,
        updatedAt: corpus.updatedAt,
      });
    }
  }

  corpora.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  return corpora;
}

export async function deleteCorpus(id) {
  await del(CORPUS_PREFIX + id);
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
