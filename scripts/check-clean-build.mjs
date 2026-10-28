import { readFile,readdir } from 'node:fs/promises';
const entry=(await readdir('dist/assets')).find(n=>/^index-.*\.js$/.test(n));
if(!entry)throw new Error('Build chybí. Spusťte npm run build.');
const source=await readFile('dist/assets/'+entry,'utf8');
const forbidden=['mock-data.js','fleetcare-demo-review','Ukázková data — prostředí pro schválení','Nová zakázka','Dokumenty ke kontrole','Potvrdit plán','Nový servis','Jan Novák'];
const found=forbidden.filter(text=>source.includes(text));
if(found.length)throw new Error('Nečistý build: '+found.join(', '));
console.log('Čistý build: bez demo bootstrapu, původních mock dat a odstraněných akcí.');
