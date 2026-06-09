import { writeFile } from 'node:fs/promises';

const source = 'https://certificates.airdata.com/BmNedR';
const response = await fetch(source, {
  headers: { 'user-agent': 'Secur-IT Flight Data Wall GitHub Action' }
});

if (!response.ok) {
  throw new Error(`Failed to fetch AirData certificate: ${response.status} ${response.statusText}`);
}

const html = await response.text();
const text = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function after(label, pattern){
  const idx = text.toLowerCase().indexOf(label.toLowerCase());
  if (idx === -1) throw new Error(`Could not find label: ${label}`);
  const chunk = text.slice(idx + label.length, idx + label.length + 80);
  const match = chunk.match(pattern);
  if (!match) throw new Error(`Could not parse value after: ${label}`);
  return match[1].trim();
}

const stats = {
  dronesFlown: after('Drones flown', /([0-9,]+)/),
  flightHours: after('Flight hours', /([0-9,.]+\s*hours?)/i),
  distanceFlown: after('Distance flown', /([0-9,.]+\s*miles?)/i),
  numberOfFlights: after('Number of flights', /([0-9,]+)/),
  lastUpdated: new Date().toISOString(),
  source
};

await writeFile('stats.json', `${JSON.stringify(stats, null, 2)}\n`);
console.log('Updated stats.json', stats);
