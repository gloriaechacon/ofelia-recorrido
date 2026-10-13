const status = document.getElementById('status');
const mapNavigation = document.body.dataset.navigation === 'map';
const mapRadius = 3000;
const defaultPlacement = {east:-4.5,north:1,height:27.5,heading:-32};
const inputs = Object.fromEntries(['east','north','height','heading'].map(id => [id,document.getElementById(id)]));
for (const [key,input] of Object.entries(inputs)) input.value = defaultPlacement[key];
const origin = { longitude: -58.2607608, latitude: -34.7159706 };
const placementStorageKey = 'ofelia-cesium-placement-v7';
let viewer, tileset, building;
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
  // Measured tower slab in glTF X/Z: 8.66 m wide, 27 m deep.
  // Cesium's Y-up, Z-forward correction maps (x,y,z) to (z,x,y).
  // Apply that same correction to the cut; using (x,-z,0) crosses it by 90°.
  const footprint = [[-4.43,-15.72],[4.53,-15.72],[4.53,11.57],[-4.43,11.57]];
  const positions = footprint.map(([x,z]) => Cesium.Matrix4.multiplyByPoint(
    building.modelMatrix,
    new Cesium.Cartesian3(z,x,0),
    new Cesium.Cartesian3(),
  ));
  tileset.clippingPolygons = new Cesium.ClippingPolygonCollection({
    polygons:[new Cesium.ClippingPolygon({positions})],
  });
  localStorage.setItem(placementStorageKey,JSON.stringify(readPlacement()));
  viewer.scene.requestRender();
}
function focusBuilding() {
  if (!viewer) return;
  if (mapNavigation) { resetMapView(); return; }
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
  if (mapNavigation) { resetMapView(); return; }
  const p = sitePosition();
  const center = Cesium.Cartesian3.fromDegrees(p.longitude,p.latitude,p.height+17);
  viewer.camera.lookAtTransform(
    Cesium.Transforms.eastNorthUpToFixedFrame(center),
    new Cesium.Cartesian3(65,-85,55),
  );
  orbit.heading = viewer.camera.heading;
  orbit.pitch = viewer.camera.pitch;
  orbit.distance = Cesium.Cartesian3.magnitude(viewer.camera.position);
  orbit.heading -= 1.95;
  focusBuilding();
}
function resetMapView() {
  if (!viewer || !building) return;
  viewer.camera.cancelFlight();
  // Local glTF front is +Z, which Cesium maps to +X. Reuse the
  // building matrix so returning home always faces the placed facade.
  const target = Cesium.Matrix4.multiplyByPoint(building.modelMatrix,
    new Cesium.Cartesian3(0,0,17),new Cesium.Cartesian3());
  const frame = Cesium.Matrix4.clone(building.modelMatrix);
  Cesium.Matrix4.setTranslation(frame,target,frame);
  viewer.camera.lookAtTransform(frame,new Cesium.Cartesian3(100,0,38));
  // Release the building frame; native Cesium controls can pan freely.
  viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  viewer.scene.requestRender();
}
function installMapControls() {
  const controls = viewer.scene.screenSpaceCameraController;
  controls.enableRotate = controls.enableTranslate = controls.enableZoom = true;
  controls.enableTilt = controls.enableLook = true;
  controls.minimumZoomDistance = 3;
  controls.maximumZoomDistance = mapRadius;
  controls.inertiaSpin = controls.inertiaTranslate = controls.inertiaZoom = 0;
  viewer.scene.canvas.style.touchAction = 'none';
  viewer.scene.canvas.addEventListener('contextmenu',event => event.preventDefault());
  const geodesic = new Cesium.EllipsoidGeodesic();
  const boundary = new Cesium.Cartographic();
  viewer.scene.preRender.addEventListener(() => {
    const p = sitePosition();
    const center = Cesium.Cartographic.fromDegrees(p.longitude,p.latitude);
    const position = viewer.camera.positionCartographic;
    if (!Number.isFinite(position.height)) return;
    geodesic.setEndPoints(center,position);
    const beyondRadius = geodesic.surfaceDistance > mapRadius+0.01;
    const height = Cesium.Math.clamp(position.height,p.height+2,mapRadius);
    if (beyondRadius || Math.abs(height-position.height)>=0.01) {
      const location = beyondRadius
        ? geodesic.interpolateUsingSurfaceDistance(mapRadius,boundary) : position;
      const direction = Cesium.Cartesian3.clone(viewer.camera.directionWC);
      const up = Cesium.Cartesian3.clone(viewer.camera.upWC);
      viewer.camera.setView({
        destination:Cesium.Cartesian3.fromRadians(location.longitude,location.latitude,height),
        orientation:{direction,up},
      });
      geodesic.setEndPoints(center,viewer.camera.positionCartographic);
      viewer.scene.requestRender();
    }
    const distanceText = `Distancia al edificio: ${(geodesic.surfaceDistance/1000).toLocaleString('es-AR',{maximumFractionDigits:2})} km`;
    const distanceLabel = document.getElementById('map-distance');
    if (distanceLabel.textContent !== distanceText) distanceLabel.textContent = distanceText;
  });
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
for (const input of Object.values(inputs)) input.addEventListener('input',() => {setPlacement();focusBuilding();});
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
  building = await Cesium.Model.fromGltfAsync({
    url:'./model/achive-tower-plants.glb',
    upAxis:Cesium.Axis.Y,
    forwardAxis:Cesium.Axis.Z,
  });
  viewer.scene.primitives.add(building);
  if (mapNavigation) installMapControls();
  else installOrbitControls();
  setPlacement();
  resetOrbit();
  status.textContent=mapNavigation ? `Exploración libre · radio de ${mapRadius/1000} km` : 'Vista de prueba · ubicación pendiente de ajuste fino';
}
start().catch(error => {
  status.textContent=error.message||String(error);
  console.error(error);
});
