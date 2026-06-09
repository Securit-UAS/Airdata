const STATS_URL = './stats.json';
const AIRDATA_CERT_URL = 'https://certificates.airdata.com/BmNedR';
const REFRESH_EVERY_MS = 60 * 60 * 1000;

const FALLBACK_STATS = {
  dronesFlown: '13',
  flightHours: '87 hours',
  distanceFlown: '490 miles',
  numberOfFlights: '954',
  lastUpdated: '2026-06-09T10:00:00.000Z',
  source: AIRDATA_CERT_URL
};

const VIDEO_PLAYLIST = [
  "OwUwgpqgcMA",
  "NMoUBGDDIfM",
  "HZW2ZO9hDk0",
  "8IecdNKvsL0",
  "lJU1ibqD5QM",
  "Eh16Se0hRxM",
  "5g3n16s93-Q",
  "AXboor4SRIA",
  "iF3Yve_zMPM"
];

const FLEET = [
  'Matrice 4TD',
  'Matrice 4E',
  'DJI Dock 3',
  'Avata 360',
  'Avata 2',
  'Mini 4 Pro',
  'Mini 3 Pro',
  'Neo',
  'Neo 2',
  'Mavic Mini'
];

let ytPlayer;
let currentIndex = 0;

function el(id){ return document.getElementById(id); }
function setText(id, value){ const node = el(id); if(node) node.textContent = value ?? '—'; }
function numberOnly(value){
  const match = String(value ?? '').match(/[0-9,.]+/);
  return match ? match[0] : '—';
}

function renderFleetTicker(){
  const track = el('fleetTrack');
  if(!track) return;
  const items = [...FLEET, ...FLEET];
  track.innerHTML = items.map(item => `<span>${item}</span>`).join('');
}

function renderStats(data){
  setText('numberOfFlights', numberOnly(data.numberOfFlights));
  setText('flightHoursNumber', numberOnly(data.flightHours));
  setText('distanceFlownNumber', numberOnly(data.distanceFlown));
  setText('dronesFlown', numberOnly(data.dronesFlown));
  setText('lastUpdated', formatDate(data.lastUpdated));
}

async function loadStats(){
  renderStats(FALLBACK_STATS);
  try{
    const res = await fetch(`${STATS_URL}?ts=${Date.now()}`, { cache:'no-store' });
    if(!res.ok) throw new Error(`stats.json returned ${res.status}`);
    const data = await res.json();
    renderStats({ ...FALLBACK_STATS, ...data });
  }catch(err){
    console.warn('Using fallback stats:', err);
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
  setText('refreshTime', next.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' }));

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
  setVideoBackground(0);
}

function setVideoBackground(index){
  const bg = el('mediaBg');
  if(bg && VIDEO_PLAYLIST[index]){
    bg.style.backgroundImage = `url("https://i.ytimg.com/vi/${VIDEO_PLAYLIST[index]}/hqdefault.jpg")`;
  }
}

function onYouTubeIframeAPIReady(){
  ytPlayer = new YT.Player('yt-player', {
    width:'100%',
    height:'100%',
    videoId:VIDEO_PLAYLIST[0],
    playerVars:{
      autoplay:1,
      controls:0,
      mute:1,
      rel:0,
      modestbranding:1,
      playsinline:1,
      fs:0,
      iv_load_policy:3
    },
    events:{
      onReady:e => {
        try{ e.target.mute(); }catch{}
        e.target.playVideo();
      },
      onStateChange:e => {
        if(e.data === YT.PlayerState.ENDED){
          currentIndex = (currentIndex + 1) % VIDEO_PLAYLIST.length;
          ytPlayer.loadVideoById(VIDEO_PLAYLIST[currentIndex]);
          setVideoBackground(currentIndex);
        }
      },
      onError:() => {
        setTimeout(() => {
          currentIndex = (currentIndex + 1) % VIDEO_PLAYLIST.length;
          ytPlayer.loadVideoById(VIDEO_PLAYLIST[currentIndex]);
          setVideoBackground(currentIndex);
        }, 1200);
      }
    }
  });
}

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

renderFleetTicker();
initYouTubeBackground();
loadStats();
startRefreshTimer();
