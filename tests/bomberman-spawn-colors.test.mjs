import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const profile = fileURLToPath(new URL('../', import.meta.url));

test('shows Friday and Saturday contributions under the Bomberman player spawn', async () => {
  const sandbox = await fs.mkdtemp(path.join(os.tmpdir(), 'bomberman-colors-'));
  try {
    await Promise.all(['scripts', '.tools', 'assets'].map(dir => fs.mkdir(path.join(sandbox, dir))));
    await fs.copyFile(path.join(profile, 'scripts/generate-bomberman.mjs'), path.join(sandbox, 'scripts/generate-bomberman.mjs'));

    const friday = new Date();
    friday.setUTCHours(0, 0, 0, 0);
    friday.setUTCDate(friday.getUTCDate() - friday.getUTCDay() - 2);
    const saturday = new Date(friday);
    saturday.setUTCDate(friday.getUTCDate() + 1);
    const days = [friday, saturday].map((date, index) => ({
      date: date.toISOString(), count: index ? 86 : 97,
      lightColor: index ? '#30a14e' : '#216e39',
      darkColor: index ? '#26a641' : '#39d353',
    }));

    const fakeRenderer = `
      const days = ${JSON.stringify(days)};
      export class ArcadeRenderer {
        constructor(options) { this.options = options; }
        async start() {
          const dark = this.options.gameTheme === 'github-dark';
          const empty = dark ? '#161b22' : '#ebedf0';
          const store = {
            grid: Array.from({length: 53}, () => Array(7).fill({})),
            contributions: days.map(day => ({
              date: new Date(day.date), count: day.count,
              color: dark ? day.darkColor : day.lightColor,
            })),
          };
          const cells = Array.from({length: 53}, (_, week) =>
            Array.from({length: 7}, (_, day) =>
              '<rect id="c-' + week + '-' + day + '" fill="' + empty + '"></rect>'
            ).join('')
          ).join('');
          this.options.svgCallback('<svg xmlns="http://www.w3.org/2000/svg">' + cells +
            '<g id="players"><animateTransform attributeName="transform"/></g></svg>');
          return store;
        }
      }
    `;
    await fs.writeFile(path.join(sandbox, '.tools/arcade.mjs'), fakeRenderer);
    await execFileAsync(process.execPath, [path.join(sandbox, 'scripts/generate-bomberman.mjs')], {
      cwd: sandbox,
      env: { ...process.env, PROFILE_GITHUB_USER: 'MoChiUaena', GITHUB_TOKEN: 'fixture-only' },
    });

    for (const [file, expected] of [
      ['bomberman.svg', ['#216e39', '#30a14e']],
      ['bomberman-dark.svg', ['#39d353', '#26a641']],
    ]) {
      const svg = await fs.readFile(path.join(sandbox, 'assets', file), 'utf8');
      assert.equal(new RegExp(`<rect id="c-51-5" fill="${expected[0]}"`).test(svg), true, `${file} lost Friday`);
      assert.equal(new RegExp(`<rect id="c-51-6" fill="${expected[1]}"`).test(svg), true, `${file} lost Saturday`);
      assert.match(svg, /<g id="players"><animateTransform attributeName="transform"\/><\/g>/);
      assert.match(svg, /<rect id="c-50-5" fill="#(?:ebedf0|161b22)"/);
    }
  } finally {
    const parent = path.resolve(os.tmpdir()) + path.sep;
    if (!sandbox.startsWith(parent) || !path.basename(sandbox).startsWith('bomberman-colors-')) {
      throw new Error('Refusing to remove a fixture outside the temporary directory');
    }
    await fs.rm(sandbox, { recursive: true, force: true });
  }
});
