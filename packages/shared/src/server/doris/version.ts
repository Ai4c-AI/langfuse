/**
 * Apache Doris version information
 */
export const DORIS_VERSION = '3.1.0';

/**
 * Checks if the current Doris version is compatible with the required version
 * @param requiredVersion The minimum required version
 * @returns True if the current version is compatible
 */
export function isDorisVersionCompatible(requiredVersion: string): boolean {
  const current = DORIS_VERSION.split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);
  
  for (let i = 0; i < Math.max(current.length, required.length); i++) {
    const currentPart = current[i] || 0;
    const requiredPart = required[i] || 0;
    
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  
  return true;
}