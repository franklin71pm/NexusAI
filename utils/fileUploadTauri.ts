// Utilidad para guardar archivos en Tauri
import { writeBinaryFile } from '@tauri-apps/api/fs';

export async function saveFileToDiskTauri(folderPath: string, fileName: string, base64Data: string): Promise<boolean> {
  try {
    // Convert base64 string to Uint8Array
    const response = await fetch(`data:application/octet-stream;base64,${base64Data}`);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Guardar el archivo en la ruta especificada
    await writeBinaryFile(`${folderPath}/${fileName}`, uint8Array);
    
    console.log(`[Tauri] Archivo guardado: ${folderPath}/${fileName}`);
    return true;
  } catch (error) {
    console.error('[Tauri] Error al guardar el archivo:', error);
    return false;
  }
}
