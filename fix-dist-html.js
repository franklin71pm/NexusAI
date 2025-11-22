import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo HTML generado
const htmlPath = path.join(__dirname, 'dist', 'index.html');

// Leer el archivo HTML
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Reemplazar rutas absolutas por relativas
htmlContent = htmlContent.replace(/src="\/([^"]*)"/g, 'src="./$1"');
htmlContent = htmlContent.replace(/href="\/([^"]*)"/g, 'href="./$1"');

// Escribir el archivo corregido
fs.writeFileSync(htmlPath, htmlContent, 'utf8');

console.log('✅ Rutas en dist/index.html corregidas a relativas');
