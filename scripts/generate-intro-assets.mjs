import fs from 'node:fs';

const assets = new URL('../assets/', import.meta.url);
const font = 'Segoe UI, Arial, sans-serif';
const universityLogo = fs.readFileSync(new URL('wuhan-university-horizontal.png', assets));
const universityLogoData = `data:image/png;base64,${universityLogo.toString('base64')}`;
const icon = (name, x, y, size, color = '#fff') => {
  const source = fs.readFileSync(new URL(`icons/${name}.svg`, assets), 'utf8');
  const paths = source.replace(/<svg[\s\S]*?>/, '').replace(/<\/svg>\s*$/, '');
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
};
const write = (file, width, height, title, body) => fs.writeFileSync(new URL(file, assets), `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`);

write('name-title.svg', 330, 58, "Hi, I'm MoChiUaena", `
  <defs><linearGradient id="name" x1="0" x2="1"><stop stop-color="#0969da"/><stop offset=".55" stop-color="#8250df"/><stop offset="1" stop-color="#007d8e"/></linearGradient></defs>
  <text x="0" y="38" font-family="${font}" font-size="32" font-weight="700" fill="url(#name)">Hi, I'm MoChiUaena</text>
  <rect x="0" y="50" width="108" height="3" rx="1.5" fill="url(#name)"/>
`);

for (const [file, label, symbol, width, from, to] of [
  ['role-java.svg','Java Backend','server',153,'#c7511f','#a94414'],
  ['role-full-stack.svg','Full-Stack','code-xml',139,'#0969da','#0b6f8e'],
  ['role-ai-agents.svg','AI Agents','bot',130,'#7142cc','#aa4ec8'],
]) {
  write(file,width,34,label,`
    <defs><linearGradient id="badge" x1="0" x2="1"><stop stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>
    <rect width="${width}" height="34" rx="7" fill="url(#badge)"/>
    ${icon(symbol,11,8,18)}
    <text x="38" y="22" font-family="${font}" font-size="13" font-weight="600" fill="#fff">${label}</text>
  `);
}

for (const dark of [false,true]) {
  for (const compact of [false,true]) {
    const width = compact ? 340 : 460;
    const height = compact ? 254 : 228;
    const secondary = dark ? '#bdc7d4' : '#4e5967';
    const accent = dark ? '#c2a0ff' : '#7141c0';
    const prefix = dark ? 'dark' : 'light';
    const textX = compact ? 22 : 26;
    const logoWidth = compact ? 272 : 282;
    const logoHeight = logoWidth * 734 / 2334;
    const schoolY = compact ? 141 : 144;
    write(`education-${prefix}${compact ? '-compact' : ''}.svg`,width,height,'Wuhan University — Undergraduate &amp; graduate studies',`
      <defs>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3294e7"/><stop offset=".55" stop-color="#9858d5"/><stop offset="1" stop-color="#21a7af"/></linearGradient>
        <linearGradient id="surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark ? '#172033' : '#f0f7ff'}"/><stop offset="1" stop-color="${dark ? '#251d38' : '#faf3ff'}"/></linearGradient>
      </defs>
      <rect x="1" y="1" width="${width-2}" height="${height-2}" rx="12" fill="url(#surface)" stroke="url(#edge)" stroke-width="1.5"/>
      <rect x="${textX}" y="14" width="${logoWidth+20}" height="${logoHeight+20}" rx="9" fill="#fff" stroke="#d0d7de" stroke-width=".8"/>
      <image x="${textX+10}" y="24" width="${logoWidth}" height="${logoHeight}" preserveAspectRatio="xMidYMid meet" href="${universityLogoData}" aria-label="Official Wuhan University emblem and Chinese–English horizontal wordmark"/>
      <text x="${textX}" y="${schoolY}" font-family="${font}" font-size="18" fill="${secondary}">${compact ? 'School of Remote Sensing' : 'School of Remote Sensing and'}</text>
      <text x="${textX}" y="${schoolY+25}" font-family="${font}" font-size="18" fill="${secondary}">${compact ? 'and Information Engineering' : 'Information Engineering'}</text>
      <rect x="${textX}" y="${compact ? 181 : 182}" width="${compact ? 294 : 322}" height="${compact ? 57 : 30}" rx="7" fill="${dark ? '#31244e' : '#e9dff9'}"/>
      <text x="${textX+12}" y="${compact ? 203 : 202}" font-family="${font}" font-size="16" font-weight="600" fill="${accent}">${compact ? 'Undergraduate &amp; graduate' : 'Undergraduate &amp; graduate studies'}</text>
      ${compact ? `<text x="${textX+12}" y="225" font-family="${font}" font-size="16" font-weight="600" fill="${accent}">studies</text>` : ''}
    `);
  }
}
console.log('Generated the gradient name, three role badges, and four education card variants.');
