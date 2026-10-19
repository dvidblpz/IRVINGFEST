# IRVINGFEST — invitación web de Halloween

## Incluye
- Invitación responsive con animaciones de terror psicológico.
- Fecha configurada: sábado 24 de octubre de 2026, 9:00 PM a 4:00 AM del día siguiente.
- Reglas visibles: disfraz obligatorio y no cerveza de vidrio.
- Dos códigos QR generados para los enlaces promocionales.
- Minijuego de 8 bits de un nivel: dos vidas, llave, salida y GAME OVER.
- Música ambiental original de terror psicológico (MP3, aprox. 48 s) con control visible de reproducir/pausar y repetición continua.
- Espacio para video con fallback visual.
- Sin confirmación por WhatsApp.
- Selección de texto deshabilitada (no es una medida de protección de contenido; solo una decisión de interfaz).

## Personalización pendiente
1. Coloca el video final en `assets/video/terror.mp4`. Se recomienda MP4 H.264, resolución 1080p o inferior.
2. La música está en `assets/audio/ambiente-psicologico.mp3`. No se reproduce automáticamente: el visitante debe pulsar **ACTIVAR AMBIENTE**. Esto evita depender del autoplay bloqueado por Safari y otros navegadores móviles.
3. Confirma el pin exacto de Google Maps antes de distribuir la invitación.

## Probar localmente
Abre `index.html` en un navegador moderno. Para una prueba más fiel, inicia un servidor estático en esta carpeta:
- Python: `python -m http.server 8000`
- Abre `http://localhost:8000`

## Publicación
Sube la carpeta completa a un hosting estático con HTTPS (por ejemplo, tu hosting actual, Netlify, Cloudflare Pages o GitHub Pages). Mantén el video optimizado y evita incluir información privada en el HTML.

## QR
- `assets/qr/promocion-1.png` → https://www.qrcreator.dev/es-ES/p/D85816F3
- `assets/qr/promocion-2.png` → https://www.qrcreator.dev/es-ES/p/C5CA78FF


## Ubicación añadida
Av. Alfonso Reyes 227, Central, Bernardo Reyes, 64190, Monterrey, Nuevo León. La invitación incluye un enlace para abrir la búsqueda de la dirección en Google Maps. Confirma el pin exacto antes de distribuir la invitación.

## Concepto de video
Consulta `CONCEPTO-VIDEO-NO-CONTESTES.md` para el guion de terror psicológico. El archivo final debe colocarse en `assets/video/terror.mp4`.


## Música de fondo
La pista `assets/audio/ambiente-psicologico.mp3` fue sintetizada para este proyecto con drones disonantes, notas ambientales y golpes graves sutiles. El control permanece visible durante el desplazamiento; el usuario puede reproducir o pausar cuando quiera. El nivel inicial del reproductor es 68% para mantener una presencia inmersiva sin reproducir automáticamente.


## Mantenimiento y futuras modificaciones

- `index.html`: contenido y estructura de cada sección; incluye comentarios junto a audio, video, juego, promociones y ubicación.
- `styles.css`: colores, tipografía, animaciones y diseño adaptable. La regla `.game-message[hidden] { display: none !important; }` es necesaria para que la capa inicial desaparezca al comenzar el juego.
- `script.js`: control de música, estado del video y lógica del minijuego; las funciones principales están comentadas.
- `assets/audio/ambiente-psicologico.mp3`: música ambiental original.
- `assets/video/terror.mp4`: ubicación prevista para el video final (aún no incluido).
- `assets/video/README.md`: instrucciones de formato y ubicación del video.

### Corrección del juego

La capa `.game-message` usaba `display:flex`, que podía prevalecer visualmente sobre el atributo HTML `hidden`. Se añadió una regla CSS explícita para ocultar la capa cuando `hidden` está presente. También se colocó la sombra lejos de la salida al iniciar el nivel.


## DJs y promociones

Los logos de los DJs aparecen en la sección de promociones, antes de los códigos QR:
- `assets/djs/chrisley-live-set.webp`
- `assets/djs/taliz.webp`

Para actualizar un logo, sustituye el archivo correspondiente conservando el nombre y las dimensiones recomendadas de imagen horizontal. Las imágenes están optimizadas en WebP para reducir el peso de descarga. Los códigos QR y sus destinos permanecen sin cambios.


## DJs y portales promocionales
- **Portal 01 — JALLZ:** `https://www.qrcreator.dev/es-ES/p/D85816F3`
- **Portal 02 — Chrisley Live Set:** `https://www.qrcreator.dev/es-ES/p/C5CA78FF`
- Los logos de ambos DJs son enlaces clicables y abren el mismo destino que su QR correspondiente en una pestaña nueva.
- Para reemplazar el logo de JALLZ, conserva la ruta `assets/djs/taliz.webp` o actualiza el `src` en `index.html`.


## Marca Dulce Invitación
El pie de página incluye un enlace a [Dulce Invitación en Facebook](https://www.facebook.com/DDInvitacion) y el eslogan: “Tú imaginas el momento... nosotros lo convertimos en una historia”. Para editar el crédito, modifica el bloque `footer-brand` en `index.html` y sus estilos en `styles.css`.


## Música y sección de DJs
- El reproductor intenta iniciar la música automáticamente al cargar la página.
- Los navegadores pueden bloquear el autoplay con sonido; en ese caso aparece “TOCA PARA ACTIVAR” y se mantiene el botón visible.
- Se quitaron las imágenes de los códigos QR. Los logos de JALLZ y Chrisley siguen siendo clicables y llevan a los enlaces que correspondían a Portal 01 y Portal 02.


## Navegación
La sección de ubicación incluye botones para Google Maps y Waze. Ambos utilizan la dirección escrita como consulta; antes de distribuir la invitación, confirma que los dos servicios abran el pin exacto del evento.


## Experiencia cinematográfica
- La invitación inicia con una portada interactiva “NO MIRES ATRÁS”. El botón “INICIAR TRANSMISIÓN” cierra la portada y también intenta iniciar la música con interacción del usuario.
- La portada incluye interferencia visual sutil y respeta `prefers-reduced-motion`.
- La cuenta regresiva está configurada para el inicio del evento: 24 de octubre de 2026 a las 21:00 en Monterrey (UTC-6), y muestra un estado “en vivo” hasta las 04:00 del día siguiente.
- Para cambiar el texto de la portada, modifica `#cinemaIntro` en `index.html`; sus estilos están al final de `styles.css`. La cuenta regresiva se encuentra en `script.js` (`eventStart` y `eventEnd`).
