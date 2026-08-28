import "server-only";
import { RekognitionClient, CompareFacesCommand } from "@aws-sdk/client-rekognition";

/**
 * Reconhecimento facial (selfie x fotos do perfil) via AWS Rekognition.
 * A selfie e as fotos de comparação passam apenas em memória, dentro desta
 * requisição — nada é salvo em disco/armazenamento.
 *
 * Requer as variáveis de ambiente AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e
 * AWS_REGION (ex.: sa-east-1 ou us-east-1). Enquanto não configuradas, o
 * recurso fica desabilitado (ver isFaceVerificationConfigured).
 */

const SIMILARITY_THRESHOLD = 85;
const MAX_REFERENCE_PHOTOS = 4;
const MAX_ATTEMPTS_PER_DAY = 5;

export function isFaceVerificationConfigured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION
  );
}

function getClient() {
  return new RekognitionClient({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

/** Compara a selfie com uma foto de referência; retorna a similaridade (0-100) ou null se não achou rosto/erro. */
async function compareOne(client: RekognitionClient, selfieBytes: Uint8Array, referenceBytes: Uint8Array) {
  try {
    const command = new CompareFacesCommand({
      SourceImage: { Bytes: selfieBytes },
      TargetImage: { Bytes: referenceBytes },
      SimilarityThreshold: 1,
    });
    const result = await client.send(command);
    const best = result.FaceMatches?.reduce(
      (max, m) => Math.max(max, m.Similarity ?? 0),
      0
    );
    return best ?? 0;
  } catch {
    // Foto sem rosto detectável, imagem corrompida, etc. — ignora essa
    // referência e segue tentando as outras.
    return null;
  }
}

/**
 * Compara a selfie com até MAX_REFERENCE_PHOTOS fotos existentes do perfil e
 * retorna a maior similaridade encontrada e se ela bateu o suficiente.
 */
export async function verifyFaceAgainstProfile(
  selfieBytes: Uint8Array,
  referencePhotos: Uint8Array[]
): Promise<{ matched: boolean; similarity: number; noFaceDetected: boolean }> {
  const client = getClient();
  const toCheck = referencePhotos.slice(0, MAX_REFERENCE_PHOTOS);

  let bestSimilarity = 0;
  let anySucceeded = false;

  for (const reference of toCheck) {
    const similarity = await compareOne(client, selfieBytes, reference);
    if (similarity !== null) {
      anySucceeded = true;
      bestSimilarity = Math.max(bestSimilarity, similarity);
    }
  }

  return {
    matched: bestSimilarity >= SIMILARITY_THRESHOLD,
    similarity: Math.round(bestSimilarity * 100) / 100,
    noFaceDetected: !anySucceeded,
  };
}

export { MAX_ATTEMPTS_PER_DAY };
