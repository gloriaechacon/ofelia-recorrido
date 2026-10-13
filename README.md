# OFELIA · recorridos 3D

Sitio estático: `index.html` reúne el exterior orbital y una prueba del living y cocina amueblados. Ambos modelos se renderizan en el navegador mediante WebGL y no requieren Unreal, Pixel Streaming, túneles ni GPU de servidor.

El exterior usa `model/part-01.bin` y `model/part-02.bin`. El interior usa `model/interior-01.bin` y `model/interior-02.bin`. Cada pareja son fragmentos consecutivos de un GLB comprimido y se reconstruyen en memoria en el navegador. Publique todas las partes completas junto a `draco/`, `orbit.js` e `interior.js`.

La prueba interior incluye living y cocina. Las texturas y luces son aproximadas respecto a D5 y Unreal; las colisiones se calculan a partir de las cajas de los muebles y paredes, por lo que algunas zonas necesitan ajustes. La primera carga transfiere el modelo al dispositivo visitante y puede tardar según su conexión.

La versión pública actual está en https://ofelia-recorrido.vercel.app/. El repositorio de GitHub conserva el código y los modelos; el sitio conectado se actualiza cuando se suben cambios a `main`.

## Vista de prueba con Cesium

`mapa.html` es la tercera experiencia, con navegación nativa libre de Cesium. Comparte `entorno.js`, el GLB, los valores de implantación y el recorte con la vista orbital del entorno. Limita la posición horizontal de la cámara a 7 km del edificio y la altura a 5 km. «Volver a la fachada» recupera un encuadre frontal y libera nuevamente la cámara. En escritorio: arrastrar para desplazarse, rueda para zoom y Ctrl + arrastrar para girar/inclinar. En móvil se usan los gestos nativos de Cesium. El radio limita la navegación; no recorta la visibilidad del horizonte.

`entorno.html` muestra Google Photorealistic 3D Tiles y el edificio sobre Almirante Brown 257. La cámara gira siempre alrededor de la torre y limita el acercamiento a 28 m y el alejamiento a 150 m. El modelo de Cesium (`model/achive-tower-plants.glb`) incluye solo la torre, sus balcones y la vegetación adherida; los árboles, el patio, los edificios bajos y el auto proceden del entorno de Google. La fotogrametría se recorta únicamente dentro de la huella de la torre y una base neutra cubre el hueco inferior. La orientación y posición siguen siendo aproximadas y requieren cotejar medidas del lote. La vista orbital independiente conserva su maqueta original.

El token se configura en el proyecto de Vercel, en **Settings → Environment Variables**, con nombre `CESIUM_ION_TOKEN` y entorno **Production**. Después de guardarlo se debe crear un nuevo deployment para que la función `api/cesium-config.js` lo lea. El token debe tener solo `assets:read`, acceso al recurso 2275207 y Allowed URL `https://ofelia-recorrido.vercel.app`. El valor llega al navegador para llamar a Cesium ion, por lo que no se considera secreto frente a visitantes; las restricciones del token limitan su uso. No colocar el valor en GitHub ni en este README.
