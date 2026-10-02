import fs from 'node:fs';
import { ArcadeRenderer } from '../.tools/arcade.mjs';

const username = process.env.PROFILE_GITHUB_USER || 'MoChiUaena';
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
for (const [theme,file] of [['github','bomberman.svg'],['github-dark','bomberman-dark.svg']]) {
  const renderer = new ArcadeRenderer({
    game:'bomberman',
    platform:'github',
    username,
    gameTheme:theme,
    githubSettings:{accessToken:process.env.GITHUB_TOKEN},
    svgCallback:svg => {
      const english = svg.replace(/>(1[0-2]|[1-9])月</g,(_,month)=>'>'+monthNames[Number(month)-1]+'<');
      fs.writeFileSync(new URL('../assets/'+file,import.meta.url),english);
    },
  });
  await renderer.start();
}
