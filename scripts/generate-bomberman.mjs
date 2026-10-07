import fs from 'node:fs';
import { ArcadeRenderer } from '../.tools/arcade.mjs';

const username = process.env.PROFILE_GITHUB_USER || 'MoChiUaena';
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const dayMs = 24 * 60 * 60 * 1000;

const utcDay = value => {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const restoreContributionColors = (svg, store) => {
  const width = store.grid.length;
  const end = store.contributions.reduce(
    (latest, contribution) => {
      const date = utcDay(contribution.date);
      return date > latest ? date : latest;
    },
    utcDay(new Date()),
  );
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (width - 1) * 7 - end.getUTCDay());

  const colors = new Map();
  for (const contribution of store.contributions) {
    if (contribution.count <= 0) continue;
    const date = utcDay(contribution.date);
    if (date < start || date > end) continue;
    const week = Math.floor((date - start) / (7 * dayMs));
    if (week >= 0 && week < width) {
      colors.set(`c-${week}-${date.getUTCDay()}`, contribution.color);
    }
  }

  const found = new Set();
  let restored = 0;
  const corrected = svg.replace(/(<rect id="(c-\d+-\d+)"[^>]*\bfill=")([^"]+)(")/g,
    (original, before, id, fill, after) => {
      const color = colors.get(id);
      if (!color) return original;
      found.add(id);
      if (fill !== color) restored++;
      return before + color + after;
    });
  const missing = [...colors.keys()].filter(id => !found.has(id));
  if (missing.length) throw new Error(`Contribution cells missing from Bomberman SVG: ${missing.join(', ')}`);
  return { svg: corrected, restored };
};

for (const [theme,file] of [['github','bomberman.svg'],['github-dark','bomberman-dark.svg']]) {
  let generatedSvg;
  const renderer = new ArcadeRenderer({
    game:'bomberman',
    platform:'github',
    username,
    gameTheme:theme,
    githubSettings:{accessToken:process.env.GITHUB_TOKEN},
    svgCallback:svg => { generatedSvg = svg; },
  });
  const store = await renderer.start();
  if (!generatedSvg) throw new Error(`Bomberman did not produce ${file}`);
  const corrected = restoreContributionColors(generatedSvg, store);
  const english = corrected.svg.replace(/>(1[0-2]|[1-9])月</g,(_,month)=>'>'+monthNames[Number(month)-1]+'<');
  fs.writeFileSync(new URL('../assets/'+file,import.meta.url),english);
  console.log(`${file}: restored ${corrected.restored} contribution cells cleared for player spawning.`);
}
