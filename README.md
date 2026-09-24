# Soundspace Academy · sitio en revisión

Versión de trabajo del nuevo sitio. **No es el sitio en producción** y no debe indexarse:
todas las páginas llevan `noindex` y el `robots.txt` está en `Disallow`.

## Cómo leerlo

Las páginas marcadas con una **franja roja arriba** traen contenido de muestra. Lo que está
dentro de un **recuadro punteado rojo** es un placeholder: el bloque ya está diseñado pero
falta el dato real. Todo lo demás es contenido definitivo y se puede revisar como tal.

Pendientes marcados así en el sitio:

- Listado de tocadas de alumnos con fecha y venue
- Datos de cada ficha de profesor (los nombres sí son los reales)
- Catálogo y reproductor de Soundspace Academy Records
- Condiciones de derechos y capacidad de lanzamientos del sello
- Inversión del Master, y formas de pago de todos los programas

## Estructura

25 páginas estáticas, sin build. Rutas relativas, así que funciona servido desde cualquier
carpeta.

- `index.html` — home
- `master-dj-producer/`, `dj-integral/`, `produccion-musical/` — los tres programas
- `clase-real/`, `records/` — rutas de conversión
- `programas/`, `academia/`, `certificacion/`, `contacto/`, `preguntas-frecuentes/`
- nueve páginas de especialización, más `sounds/`, `space/`, `business/` y los legales
- `styles.css`, `app.js`, `assets/`

## Verlo en local

```bash
python3 -m http.server 4321
```

Y abrir http://localhost:4321

## Medición

Los eventos no dependen del texto de los botones: cada CTA lleva `data-cta-id`,
`data-track` y `data-program`, y cada página declara `data-template`, `data-program` y
`data-avatar`. Se emiten `page_view`, `program_view`, `quiz_start`, `whatsapp_click` y
`sample_class_click`, conservando `origin`, `source_path` y las UTMs hacia el quiz y hacia
WhatsApp.
