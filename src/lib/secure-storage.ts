/**
 * Secure storage utility for encrypting sensitive data in localStorage
 */

class SecureStorage {
  private encryptionKey: string;

  constructor() {
    // Generate or retrieve encryption key
    this.encryptionKey = this.getOrCreateEncryptionKey();
  }

  private getOrCreateEncryptionKey(): string {
    const existingKey = localStorage.getItem('_enc_key');
    if (existingKey) {
      return existingKey;
    }
    
    // Generate a new encryption key
    const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    localStorage.setItem('_enc_key', key);
    return key;
  }

  private async encrypt(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Use a simple XOR encryption for client-side (better than plain text)
    const keyBytes = new TextEncoder().encode(this.encryptionKey);
    const encrypted = new Uint8Array(data.length);
    
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return btoa(String.fromCharCode(...encrypted));
  }

  private async decrypt(encryptedText: string): Promise<string> {
    try {
      const encrypted = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
      );
      
      const keyBytes = new TextEncoder().encode(this.encryptionKey);
      const decrypted = new Uint8Array(encrypted.length);
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(value);
      localStorage.setItem(`_sec_${key}`, encrypted);
    } catch (error) {
      console.error('Secure storage setItem failed:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(`_sec_${key}`);
      if (!encrypted) return null;
      
      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Secure storage getItem failed:', error);
      return null;
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(`_sec_${key}`);
  }

  clear(): void {
    // Clear all secure storage items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('_sec_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const secureStorage = new SecureStorage();