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

const DRONES = [
  ['Matrice 4TD/E', 'Thermal and survey'],
  ['DJI Dock 2', 'Remote operations'],
  ['Neo 2', 'Rapid response'],
  ['Avata 2', 'FPV inspection'],
  ['Mini 4 Pro', 'Lightweight survey'],
  ['Mavic Mini', 'Legacy platform']
];

let ytPlayer;
let currentIndex = 0;

function el(id){ return document.getElementById(id); }
function setText(id, value){ const node = el(id); if (node) node.textContent = value ?? '—'; }

function renderStaticSections(){
  const target = el('droneTypes');
  if(!target) return;
  target.innerHTML = DRONES.map(([name, role]) => `
    <article class="fleet-card">
      <strong>${name}</strong>
      <span>${role}</span>
    </article>
  `).join('');
}

async function loadStats(){
  try{
    const res = await fetch(`${STATS_URL}?ts=${Date.now()}`, { cache:'no-store' });
    if(!res.ok) throw new Error(`stats.json returned ${res.status}`);
    const data = await res.json();
    setText('dronesFlown', data.dronesFlown);
    setText('flightHours', stripUnit(data.flightHours, 'hours'));
    setText('distanceFlown', stripUnit(data.distanceFlown, 'miles'));
    setText('numberOfFlights', data.numberOfFlights);
    setText('lastUpdated', `Last data update: ${formatDate(data.lastUpdated)}`);
    setText('dataStatus', `Verified by AirData · ${formatDate(data.lastUpdated)}`);
  }catch(err){
    console.error(err);
    setText('dataStatus', 'AirData status: stats.json unavailable, using fallback display');
  }
}

function stripUnit(value, unit){
  if(!value) return '—';
  return String(value).replace(new RegExp(`\\s*${unit}s?`, 'i'), '').trim();
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
    const bar = el('bar');
    if(bar) bar.style.width = `${pct.toFixed(2)}%`;
  }, 500);
  clearTimeout(window._refreshTimer);
  window._refreshTimer = setTimeout(async () => {
    await loadStats();
    const bar = el('bar');
    if(bar) bar.style.width = '0%';
    startRefreshTimer();
  }, REFRESH_EVERY_MS);
}

function initYouTubeBackground(){
  if(el('mediaBg') && VIDEO_PLAYLIST.length){
    el('mediaBg').style.backgroundImage = `url("https://i.ytimg.com/vi/${VIDEO_PLAYLIST[0]}/maxresdefault.jpg")`;
  }
}

function updateMediaBg(){
  const bg = el('mediaBg');
  if(bg) bg.style.backgroundImage = `url("https://i.ytimg.com/vi/${VIDEO_PLAYLIST[currentIndex]}/maxresdefault.jpg")`;
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
          updateMediaBg();
        }
      },
      onError:() => {
        setTimeout(() => {
          currentIndex = (currentIndex + 1) % VIDEO_PLAYLIST.length;
          ytPlayer.loadVideoById(VIDEO_PLAYLIST[currentIndex]);
          updateMediaBg();
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
