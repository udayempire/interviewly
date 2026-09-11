import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        throw new Error("ENCRYPTION_KEY is not configured");
    }

    const buffer = Buffer.from(key, "base64");

    if (buffer.length !== KEY_LENGTH) {
        throw new Error("ENCRYPTION_KEY must be a 32-byte base64 key");
    }

    return buffer;
}

export function encrypt(text: string): string {
    const key = getEncryptionKey();

    // Generate a unique IV for every encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(text, "utf8"),
        cipher.final(),
    ]);

    // Authentication tag protects against tampering
    const authTag = cipher.getAuthTag();

    // iv.authTag.encrypted
    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64"),
    ].join(".");
}

export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();

    const parts = encryptedData.split(".");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts;

    const iv = Buffer.from(ivBase64, "base64");
    const authTag = Buffer.from(authTagBase64, "base64");
    const encrypted = Buffer.from(encryptedBase64, "base64");

    if (iv.length !== IV_LENGTH) {
        throw new Error("Invalid IV");
    }

    if (authTag.length !== 16) {
        throw new Error("Invalid authentication tag");
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]);

    return decrypted.toString("utf8");
}