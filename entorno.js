const status = document.getElementById('status');
const inputs = Object.fromEntries(['east','north','height','heading'].map(id => [id,document.getElementById(id)]));
const origin = { longitude: -58.2607608, latitude: -34.7159706 };
let viewer, tileset, building;

function readPlacement() {
  return Object.fromEntries(Object.entries(inputs).map(([key,input]) => [key,Number(input.value)||0]));
}
function sitePosition() {
  const p = readPlacement();
  return {
    longitude: origin.longitude + p.east / 91300,
    latitude: origin.latitude + p.north / 111000,
    height: p.height,
    heading: p.heading,
  };
}
function setPlacement() {
  if (!viewer || !tileset || !building) return;
  const p = sitePosition();
  const center = Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,p.height);
  building.modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(
    center,
    new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(p.heading),0,0),
  );
  const east = 11/91300, north = 17/111000;
  tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [new Cesium.ClippingPolygon({
      positions: Cesium.Cartesian3.fromDegreesArray([
        p.longitude-east,p.latitude-north,
        p.longitude+east,p.latitude-north,
        p.longitude+east,p.latitude+north,
        p.longitude-east,p.latitude+north,
      ]),
    })],
  });
  localStorage.setItem('ofelia-cesium-placement',JSON.stringify(readPlacement()));
  viewer.scene.requestRender();
}
function focusBuilding() {
  if (!viewer) return;
  const p = sitePosition();
  const center = Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,p.height+17);
  viewer.camera.lookAt(center,new Cesium.Cartesian3(65,-85,55));
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  viewer.scene.requestRender();
}
for (const input of Object.values(inputs)) input.addEventListener('change',() => {setPlacement();focusBuilding();});
document.getElementById('reset').addEventListener('click',focusBuilding);
try {
  const saved = JSON.parse(localStorage.getItem('ofelia-cesium-placement')||'null');
  if (saved) for (const [key,input] of Object.entries(inputs)) {
    if (Number.isFinite(saved[key])) input.value = saved[key];
  }
} catch (_) { /* Ignore old browser settings. */ }

async function start() {
  if (!window.Cesium) throw new Error('No se pudo descargar CesiumJS. Comprueba la conexión a Internet.');
  const response = await fetch('./api/cesium-config',{cache:'no-store'});
  if (!response.ok && response.status === 404) throw new Error('La vista requiere el token configurado en Vercel.');
  const config = await response.json().catch(() => ({}));
  if (!response.ok || !config.token) throw new Error(config.error || 'Falta configurar CESIUM_ION_TOKEN en Vercel.');
  Cesium.Ion.defaultAccessToken = config.token;
  viewer = new Cesium.Viewer('cesium',{
    globe:false,
    geocoder:false,
    baseLayerPicker:false,
    homeButton:false,
    sceneModePicker:false,
    navigationHelpButton:false,
    infoBox:false,
    selectionIndicator:false,
    animation:false,
    timeline:false,
    requestRenderMode:true,
  });
  status.textContent='Cargando el entorno de Google…';
  tileset = await Cesium.createGooglePhotorealistic3DTileset(
    {onlyUsingWithGoogleGeocoder:true},
    {maximumScreenSpaceError: matchMedia('(pointer: coarse)').matches ? 24 : 16},
  );
  viewer.scene.primitives.add(tileset);
  status.textContent='Colocando el edificio…';
  building = await Cesium.Model.fromGltfAsync({url:'./model/achive-tower.glb'});
  viewer.scene.primitives.add(building);
  setPlacement();
  focusBuilding();
  status.textContent='Vista de prueba · ubicación pendiente de ajuste fino';
}
start().catch(error => {
  status.textContent=error.message||String(error);
  console.error(error);
});
