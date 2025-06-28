# PDF.js Assets

Esta carpeta contiene los archivos necesarios para PDF.js.

## Instalación

Para instalar PDF.js, ejecuta:

```bash
# Descargar PDF.js desde GitHub releases
# https://github.com/mozilla/pdf.js/releases

# O usar npm
npm install pdfjs-dist

# Copiar archivos necesarios:
# - build/pdf.min.js
# - build/pdf.worker.min.js  
# - web/viewer.html
# - web/viewer.js
# - web/viewer.css
# - web/locale/ (opcional)
```

## Estructura requerida

```
src/assets/pdfjs/
├── build/
│   ├── pdf.min.js
│   └── pdf.worker.min.js
└── web/
    ├── viewer.html
    ├── viewer.js
    ├── viewer.css
    └── locale/ (opcional)
```

## Uso

Los componentes alternativos de visualización de documentos requieren estos archivos para funcionar correctamente.
