const STATS_URL = './stats.json';
const AIRDATA_CERT_URL = 'https://certificates.airdata.com/BmNedR';
const REFRESH_EVERY_MS = 60 * 60 * 1000;

const VIDEO_PLAYLIST = [
  '9P-4ax971wo',
  '-HFS6P-FBOc',
  'UuNGXrXry4k',
  'OwUwgpqgcMA',
  'NMoUBGDDIfM',
  'HZW2ZO9hDk0',
  '8IecdNKvsL0',
  'lJU1ibqD5QM',
  'Eh16Se0hRxM',
  '5g3n16s93-Q',
  'AXboor4SRIA',
  'iF3Yve_zMPM'
];

const DRONES = ['Avata 360','Lito X1','Matrice 4TD','Mavic Mini','Mini 2','Mini 3 Pro','Mini 4 Pro','Mini 5 Pro','Neo','Neo 2'];
const CERTIFICATES = [
  ['CAA','UK CAA\nCAA A2'],
  ['CAA','UK CAA\nCAA A1 & A3'],
  ['CAA','UK CAA\nCAA Multi-rotor'],
  ['EASA','EASA France\nSASA A1 & A3'],
  ['DD','DroneDeploy\nFundamentals'],
  ['DD','DroneDeploy\nGround'],
  ['DD','DroneDeploy\nZero to Hero'],
  ['DD','DroneDeploy\nSolar Analyst'],
  ['DD','DroneDeploy\nConstruction Analyst'],
  ['FAA','FAA\nPart 107 Certificate']
];
const SAFETY = ['In-flight\nWind Safety','Maintenance\nTracking','Automatic\nAlerts','Scheduled\nReports','Enterprise\nCompliance'];

let ytPlayer;
let currentIndex = 0;

function el(id){ return document.getElementById(id); }
function setText(id, value){ const node = el(id); if (node) node.textContent = value ?? '—'; }

function renderStaticSections(){
  el('droneTypes').innerHTML = DRONES.map(name => `<div class="drone-chip">${name}</div>`).join('');
  el('certificates').innerHTML = CERTIFICATES.map(([tag, text]) => `<div class="cert-card"><span>${tag}</span><small>${text.replace('\n','<br>')}</small></div>`).join('');
  el('safetyItems').innerHTML = SAFETY.map(text => `<div class="safety-item"><div class="star">★</div>${text.replace('\n','<br>')}</div>`).join('');
}

async function loadStats(){
  try{
    const res = await fetch(`${STATS_URL}?ts=${Date.now()}`, { cache:'no-store' });
    if(!res.ok) throw new Error(`stats.json returned ${res.status}`);
    const data = await res.json();
    setText('dronesFlown', data.dronesFlown);
    setText('flightHours', data.flightHours);
    setText('distanceFlown', data.distanceFlown);
    setText('numberOfFlights', data.numberOfFlights);
    setText('lastUpdated', `Last data update: ${formatDate(data.lastUpdated)}`);
    setText('dataStatus', `AirData verified source linked · ${data.source || AIRDATA_CERT_URL}`);
  }catch(err){
    console.error(err);
    setText('dataStatus', 'AirData status: stats.json unavailable, using fallback display');
  }
}

function formatDate(value){
  if(!value) return '—';
  const d = new Date(value);
  if(Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-GB', { dateStyle:'short', timeStyle:'short' });
}

function startRefreshTimer(){
  const start = Date.now();
  const next = new Date(start + REFRESH_EVERY_MS);
  setText('refreshPill', `Next stats refresh: ${next.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}`);
  clearInterval(window._progressTimer);
  window._progressTimer = setInterval(() => {
    const pct = Math.min(100, ((Date.now() - start) / REFRESH_EVERY_MS) * 100);
    el('bar').style.width = `${pct.toFixed(2)}%`;
  }, 500);
  clearTimeout(window._refreshTimer);
  window._refreshTimer = setTimeout(async () => {
    await loadStats();
    el('bar').style.width = '0%';
    startRefreshTimer();
  }, REFRESH_EVERY_MS);
}

function initYouTubeBackground(){
  if(el('mediaBg') && VIDEO_PLAYLIST.length){
    el('mediaBg').style.backgroundImage = `url("https://i.ytimg.com/vi/${VIDEO_PLAYLIST[0]}/hqdefault.jpg")`;
  }
}

function onYouTubeIframeAPIReady(){
  ytPlayer = new YT.Player('yt-player', {
    width:'100%',
    height:'100%',
    videoId:VIDEO_PLAYLIST[0],
    playerVars:{ autoplay:1, controls:1, mute:1, rel:0, modestbranding:1, playsinline:1, fs:1, iv_load_policy:3 },
    events:{
      onReady:e => { try{ e.target.mute(); }catch{} e.target.playVideo(); },
      onStateChange:e => {
        if(e.data === YT.PlayerState.ENDED){
          currentIndex = (currentIndex + 1) % VIDEO_PLAYLIST.length;
          ytPlayer.loadVideoById(VIDEO_PLAYLIST[currentIndex]);
          el('mediaBg').style.backgroundImage = `url("https://i.ytimg.com/vi/${VIDEO_PLAYLIST[currentIndex]}/hqdefault.jpg")`;
        }
      },
      onError:() => {
        setTimeout(() => {
          currentIndex = (currentIndex + 1) % VIDEO_PLAYLIST.length;
          ytPlayer.loadVideoById(VIDEO_PLAYLIST[currentIndex]);
        }, 1200);
      }
    }
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

renderStaticSections();
initYouTubeBackground();
loadStats();
startRefreshTimer();
