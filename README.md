# OFELIA · recorridos 3D

Sitio estático: `index.html` reúne el exterior orbital y una prueba del living y cocina amueblados. Ambos modelos se renderizan en el navegador mediante WebGL y no requieren Unreal, Pixel Streaming, túneles ni GPU de servidor.

El exterior usa `model/part-01.bin` y `model/part-02.bin`. El interior usa `model/interior-01.bin` y `model/interior-02.bin`. Cada pareja son fragmentos consecutivos de un GLB comprimido y se reconstruyen en memoria en el navegador. Publique todas las partes completas junto a `draco/`, `orbit.js` e `interior.js`.

La prueba interior incluye living y cocina. Las texturas y luces son aproximadas respecto a D5 y Unreal; las colisiones se calculan a partir de las cajas de los muebles y paredes, por lo que algunas zonas necesitan ajustes. La primera carga transfiere el modelo al dispositivo visitante y puede tardar según su conexión.

La versión pública actual está en https://ofelia-recorrido.vercel.app/. El repositorio de GitHub conserva el código y los modelos; el sitio conectado se actualiza cuando se suben cambios a `main`.

## Vista de prueba con Cesium

`entorno.html` muestra Google Photorealistic 3D Tiles y el edificio sobre Almirante Brown 257. La cámara gira siempre alrededor de la torre y limita el acercamiento a 28 m y el alejamiento a 150 m. La posición sigue siendo aproximada y requiere ajuste visual antes de enlazar esta vista desde la portada. No se recorta la fotogrametría de Google: el recorte dejaba un hueco negro, mientras que sin él la geometría existente puede solaparse con la torre. `model/achive-tower.glb` contiene una copia ligera y aislada de la torre; el orbital original no se modifica.

El token se configura en el proyecto de Vercel, en **Settings → Environment Variables**, con nombre `CESIUM_ION_TOKEN` y entorno **Production**. Después de guardarlo se debe crear un nuevo deployment para que la función `api/cesium-config.js` lo lea. El token debe tener solo `assets:read`, acceso al recurso 2275207 y Allowed URL `https://ofelia-recorrido.vercel.app`. El valor llega al navegador para llamar a Cesium ion, por lo que no se considera secreto frente a visitantes; las restricciones del token limitan su uso. No colocar el valor en GitHub ni en este README.
