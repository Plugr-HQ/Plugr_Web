import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, 'bank-logo-manifest.json');
const outDir = join(__dirname, '..', 'public', 'bank-logos');

const manifest = JSON.parse(await (await import('node:fs/promises')).readFile(manifestPath, 'utf-8'));

await mkdir(outDir, { recursive: true });

for (const bank of manifest) {
    const dest = join(outDir, `${bank.code}.png`);
    try {
        const res = await fetch(bank.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(dest, buf);
        console.log(`✓ ${bank.code}.png  (${bank.name})`);
    } catch (err) {
        console.error(`✗ ${bank.code}.png  (${bank.name}) — ${err.message}`);
    }
}

console.log('\nDone. Check the ✗ lines above if any failed — re-run is safe, it just overwrites.');