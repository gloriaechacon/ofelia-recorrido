# OFELIA · recorridos 3D

Sitio estático: `index.html` reúne el exterior orbital y una prueba del living y cocina amueblados. Ambos modelos se renderizan en el navegador mediante WebGL y no requieren Unreal, Pixel Streaming, túneles ni GPU de servidor.

El exterior usa `model/part-01.bin` y `model/part-02.bin`. El interior usa `model/interior-01.bin` y `model/interior-02.bin`. Cada pareja son fragmentos consecutivos de un GLB comprimido y se reconstruyen en memoria en el navegador. Publique todas las partes completas junto a `draco/`, `orbit.js` e `interior.js`.

La prueba interior incluye living y cocina. Las texturas y luces son aproximadas respecto a D5 y Unreal; las colisiones se calculan a partir de las cajas de los muebles y paredes, por lo que algunas zonas necesitan ajustes. La primera carga transfiere el modelo al dispositivo visitante y puede tardar según su conexión.

La versión pública actual está en https://ofelia-recorrido.vercel.app/. El repositorio de GitHub conserva el código y los modelos; el sitio conectado se actualiza cuando se suben cambios a `main`.
