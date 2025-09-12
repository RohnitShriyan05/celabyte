"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptConnection = decryptConnection;
// src/services/secretStore.ts
// Abstraction: decrypt connection URIs stored as ciphertext
const env_1 = require("../config/env");
async function decryptConnection(encUri, encMeta) {
    switch (env_1.env.secretsBackend) {
        case "env": {
            // DEV-ONLY example: base64 “DEK” used with AES-GCM (omitted for brevity)
            // In prod: implement AWS KMS (encrypt/decrypt), GCP KMS, or Vault transit.
            // Here we just return the encUri as plain for demo (DON’T do this in prod).
            return { uri: encUri };
        }
        default:
            throw new Error("secrets backend not implemented");
    }
}
