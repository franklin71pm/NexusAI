// Tauri file system utilities with dynamic imports for web compatibility
// This file provides Tauri-specific file operations that only work when running in Tauri runtime

/**
 * Save file to disk using Tauri's file system API
 * Only works when running inside Tauri desktop app
 */
export async function saveFileToDiskTauri(folderPath: string, fileName: string, base64Data: string): Promise<boolean> {
  // Detect Tauri presence at runtime (window.__TAURI__ exists when running inside Tauri)
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    // Running on the web - return false to indicate Tauri API is not available
    console.warn('Tauri fs API not available in web build. File not saved to disk.');
    return false;
  }

  try {
    // Dynamic import to avoid bundling Tauri modules in web builds
    const fs = await import('@tauri-apps/api/fs');
    const path = await import('@tauri-apps/api/path');
    
    // Ensure the directory exists
    const fullPath = await path.join(folderPath, fileName);
    const dirPath = await path.dirname(fullPath);
    
    // Write the file
    await fs.writeBinaryFile(fullPath, Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)));
    return true;
  } catch (error) {
    console.error('Error saving file with Tauri API:', error);
    return false;
  }
}

/**
 * Read file from disk using Tauri's file system API
 * Only works when running inside Tauri desktop app
 */
export async function readFileFromDiskTauri(filePath: string): Promise<string | null> {
  // Detect Tauri presence at runtime
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    console.warn('Tauri fs API not available in web build. Cannot read file from disk.');
    return null;
  }

  try {
    const fs = await import('@tauri-apps/api/fs');
    const fileData = await fs.readBinaryFile(filePath);
    return btoa(String.fromCharCode(...fileData));
  } catch (error) {
    console.error('Error reading file with Tauri API:', error);
    return null;
  }
}

/**
 * Check if Tauri runtime is available
 */
export function isTauriAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).__TAURI__;
}
