<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11KE97gfFx5z3i_rrPqS6Iae5Vcmzd1Dn

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to GitHub Pages / Netlify

1. Haz commit de tu código limpio y sin carpetas nativas (Tauri) ni archivos de build.
2. Sube el repositorio a GitHub.
3. Para Netlify, conecta el repo y usa el comando de build: `vite build` y como directorio de publicación `dist`.

## Notas de limpieza
- Todo rastro de Tauri ha sido eliminado.
- El `.gitignore` incluye reglas para Node, Vite y Tauri.
- No subas `.env.local` ni archivos de configuración sensibles.
