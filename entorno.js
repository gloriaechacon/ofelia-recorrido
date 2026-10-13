const status = document.getElementById('status');
const inputs = Object.fromEntries(['east','north','height','heading'].map(id => [id,document.getElementById(id)]));
const origin = { longitude: -58.2607608, latitude: -34.7159706 };
const placementStorageKey = 'ofelia-cesium-placement-v2';
let viewer, tileset, building, groundPatch;
const orbit = {heading: 0, pitch: -0.48, distance: 118};
const orbitLimits = {minDistance: 28, maxDistance: 150, minPitch: -1.4, maxPitch: -0.12};

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
  const clipCorners = [[-9,-16],[9,-16],[9,16],[-9,16]];
  const patchCorners = [[-9.5,-16.5],[9.5,-16.5],[9.5,16.5],[-9.5,16.5]];
  const worldCorners = corners => corners.map(([x,y]) =>
    Cesium.Matrix4.multiplyByPoint(building.modelMatrix,new Cesium.Cartesian3(x,y,0),new Cesium.Cartesian3()));
  tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons: [new Cesium.ClippingPolygon({
      positions: worldCorners(clipCorners),
    })],
  });
  const patchPositions = worldCorners(patchCorners).map(position => {
    const point = Cesium.Cartographic.fromCartesian(position);
    return Cesium.Cartesian3.fromRadians(point.longitude,point.latitude,p.height-1.3);
  });
  if (groundPatch) viewer.entities.remove(groundPatch);
  groundPatch = viewer.entities.add({
    polygon: {
      hierarchy: patchPositions,
      perPositionHeight: true,
      material: Cesium.Color.fromCssColorString('#7e786e'),
      doubleSided: true,
    },
  });
  localStorage.setItem(placementStorageKey,JSON.stringify(readPlacement()));
  viewer.scene.requestRender();
}
function focusBuilding() {
  if (!viewer) return;
  const p = sitePosition();
  const center = Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,p.height+17);
  viewer.camera.lookAtTransform(
    Cesium.Transforms.eastNorthUpToFixedFrame(center),
    new Cesium.HeadingPitchRange(orbit.heading,orbit.pitch,orbit.distance),
  );
  viewer.scene.requestRender();
}
function resetOrbit() {
  if (!viewer) return;
  const p = sitePosition();
  const center = Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,p.height+17);
  viewer.camera.lookAtTransform(
    Cesium.Transforms.eastNorthUpToFixedFrame(center),
    new Cesium.Cartesian3(65,-85,55),
  );
  orbit.heading = viewer.camera.heading;
  orbit.pitch = viewer.camera.pitch;
  orbit.distance = Cesium.Cartesian3.magnitude(viewer.camera.position);
  viewer.scene.requestRender();
}
function installOrbitControls() {
  const controls = viewer.scene.screenSpaceCameraController;
  controls.enableRotate = false;
  controls.enableTranslate = false;
  controls.enableZoom = false;
  controls.enableTilt = false;
  controls.enableLook = false;
  const canvas = viewer.scene.canvas;
  canvas.style.touchAction = 'none';
  const pointers = new Map();
  let lastPinchDistance = 0;
  canvas.addEventListener('pointerdown',event => {
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    lastPinchDistance = 0;
  });
  canvas.addEventListener('pointermove',event => {
    if (!pointers.has(event.pointerId)) return;
    const last = pointers.get(event.pointerId);
    pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if (pointers.size === 1) {
      orbit.heading -= (event.clientX-last.x)*0.0025;
      orbit.pitch = Cesium.Math.clamp(orbit.pitch+(event.clientY-last.y)*0.0025,
        orbitLimits.minPitch,orbitLimits.maxPitch);
    } else if (pointers.size === 2) {
      const [a,b] = [...pointers.values()];
      const pinchDistance = Math.hypot(a.x-b.x,a.y-b.y);
      if (lastPinchDistance) orbit.distance = Cesium.Math.clamp(
        orbit.distance*lastPinchDistance/pinchDistance,
        orbitLimits.minDistance,orbitLimits.maxDistance);
      lastPinchDistance = pinchDistance;
    }
    focusBuilding();
  });
  const release = event => {pointers.delete(event.pointerId);lastPinchDistance=0;};
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('wheel',event => {
    event.preventDefault();
    orbit.distance = Cesium.Math.clamp(
      orbit.distance*Math.exp(event.deltaY*0.001),
      orbitLimits.minDistance,orbitLimits.maxDistance);
    focusBuilding();
  },{passive:false});
}
for (const input of Object.values(inputs)) input.addEventListener('change',() => {setPlacement();focusBuilding();});
document.getElementById('reset').addEventListener('click',resetOrbit);
try {
  const saved = JSON.parse(localStorage.getItem(placementStorageKey)||'null');
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
  installOrbitControls();
  setPlacement();
  resetOrbit();
  status.textContent='Vista de prueba · ubicación pendiente de ajuste fino';
}
start().catch(error => {
  status.textContent=error.message||String(error);
  console.error(error);
});
