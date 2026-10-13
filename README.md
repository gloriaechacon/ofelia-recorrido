# OFELIA · recorridos 3D

Sitio estático preparado para GitHub Pages. `index.html` reúne el exterior orbital y el interior de Unreal.

El exterior usa `model/part-01.bin` y `model/part-02.bin`, dos partes del GLB comprimido. Ambas deben publicarse completas. Su archivo original se conserva fuera de este paquete.

`config.json` contiene ahora una dirección temporal de Cloudflare Quick Tunnel para el interior. La computadora con GPU debe seguir encendida y mantener activos Unreal, la señalización y los túneles. La dirección cambia si se reinicia el túnel. Para una publicación estable, reemplaza `interiorUrl` con la URL HTTPS permanente del reproductor Pixel Streaming. La conexión WebRTC puede necesitar un servidor TURN para visitantes en otras redes.

Este paquete es el contenido del repositorio `gloriaechacon/ofelia-recorrido`. Subirlo a GitHub conserva el código y los recursos, pero no publica automáticamente el sitio. La demostración actual funciona mediante Cloudflare Quick Tunnel, fuera de GitHub.
