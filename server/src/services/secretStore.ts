// src/services/secretStore.ts
// Abstraction: decrypt connection URIs stored as ciphertext
import { env } from "../config/env"

export interface DecryptResult { uri: string }
export async function decryptConnection(encUri:string, encMeta:string):Promise<DecryptResult>{
  switch(env.secretsBackend){
    case "env": {
      // DEV-ONLY example: base64 “DEK” used with AES-GCM (omitted for brevity)
      // In prod: implement AWS KMS (encrypt/decrypt), GCP KMS, or Vault transit.
      // Here we just return the encUri as plain for demo (DON’T do this in prod).
      return { uri: encUri }
    }
    default:
      throw new Error("secrets backend not implemented")
  }
}
