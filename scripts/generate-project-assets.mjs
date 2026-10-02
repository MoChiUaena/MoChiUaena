import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const config = JSON.parse(fs.readFileSync(new URL('config/project-assets.json', root), 'utf8'));
const assets = new URL('assets/', root);
const font = 'Segoe UI, Arial, sans-serif';
const mono = 'Consolas, monospace';
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const themes = {
  blue: {light:'#0969da',dark:'#79b8ff',end:'#36a3df',surface:'#edf5ff',darkSurface:'#13253b',border:'#bdd5f4'},
  purple: {light:'#7540c8',dark:'#c4a0ff',end:'#aa68d3',surface:'#f5efff',darkSurface:'#271d3d',border:'#d8c5ed'},
  teal: {light:'#087c80',dark:'#62d2ca',end:'#2bab98',surface:'#ebf9f6',darkSurface:'#102c2a',border:'#b7ddd7'},
  orange: {light:'#b65d10',dark:'#ffbb78',end:'#e99639',surface:'#fff6ec',darkSurface:'#332519',border:'#efd2b4'},
};
const icon = (name,x,y,size,color) => {
  const source = fs.readFileSync(new URL('icons/'+name+'.svg', assets),'utf8');
  const paths = source.replace(/<svg[\s\S]*?>/,'').replace(/<\/svg>\s*$/,'');
  return '<g transform="translate('+x+' '+y+') scale('+(size/24)+')" fill="none" stroke="'+color+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths+'</g>';
};
const write = (file,width,height,title,body) => fs.writeFileSync(new URL(file,assets),'<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+body+'</svg>\n');
const measure = (text,size) => [...text].reduce((sum,c)=>sum+(/[ilI.,:!|' ]/.test(c)?0.27:/[mwMW@]/.test(c)?0.84:/[A-Z]/.test(c)?0.64:0.52)*size,0);
const wrap = (value,width,size) => {
  const lines=[]; let line='';
  for (const word of value.split(' ')) {
    const next=line ? line+' '+word : word;
    if (line && measure(next,size)>width) { lines.push(line); line=word; } else line=next;
  }
  if (line) lines.push(line);
  return lines;
};
const text = (value,x,y,size,color,weight=400,extra='') => '<text x="'+x+'" y="'+y+'" font-family="'+font+'" font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'" '+extra+'>'+esc(value)+'</text>';
const badge = (label,x,y,color,surface) => {
  const width=Math.ceil(measure(label,13))+26;
  return '<rect x="'+x+'" y="'+y+'" width="'+width+'" height="26" rx="7" fill="'+surface+'"/>'+text(label,x+13,y+18,13,color,600);
};
for (const dark of [false,true]) {
  const color=dark ? '#bdc7d4' : '#57606a';
  write('pr-label-'+(dark ? 'dark' : 'light')+'.svg',57,30,'My PRs:',text('My PRs:',0,20,12.5,color,600));
}
for (const group of ['projects','contributions']) {
  for (const item of config[group]) {
    const upstream=group==='contributions';
    for (const dark of [false,true]) {
      for (const compact of [false,true]) {
        const width=compact ? 300 : upstream ? 832 : 400;
        const height=compact ? 276 : upstream ? 146 : 222;
        const colors=themes[item.theme];
        const accent=dark ? colors.dark : colors.light;
        const surface=dark ? colors.darkSurface : colors.surface;
        const primary=dark ? '#edf3fb' : '#1f2328';
        const secondary=dark ? '#c1cbd8' : '#505e6c';
        const muted=dark ? '#a5b4c8' : '#667588';
        const border=dark ? '#364457' : colors.border;
        const left=compact ? 20 : 24;
        const bodyX=upstream && !compact ? 80 : left;
        const summaryWidth=width-bodyX-(compact ? 20 : 24);
        const summarySize=compact ? 16 : 16;
        const lines=wrap(item.description,summaryWidth,summarySize);
        const summaryY=compact ? 122 : upstream ? 86 : 99;
        const lineHeight=compact ? 23 : upstream ? 21 : 22;
        const footerY=compact ? 231 : upstream ? 113 : 182;
        if (summaryY+(lines.length-1)*lineHeight>(compact ? 212 : upstream ? 108 : 157)) throw new Error('Description exceeds card for '+item.id);
        const background='<defs><linearGradient id="surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+surface+'"/><stop offset="1" stop-color="'+(dark ? '#151c27' : '#ffffff')+'"/></linearGradient><linearGradient id="accent" x1="0" x2="1"><stop stop-color="'+accent+'"/><stop offset="1" stop-color="'+colors.end+'"/></linearGradient></defs><rect x="1" y="1" width="'+(width-2)+'" height="'+(height-2)+'" rx="14" fill="url(#surface)" stroke="'+border+'"/><rect x="16" y="1" width="'+(width-32)+'" height="4" rx="2" fill="url(#accent)"/>';
        const iconTile='<rect x="'+left+'" y="22" width="42" height="42" rx="11" fill="'+surface+'" stroke="'+border+'"/>'+icon(item.icon,left+9,31,24,accent);
        const header=text(item.category,left+56,compact ? 46 : 35,compact ? 10.5 : 10.8,accent,600,'letter-spacing=".5"')+text(item.name,compact ? left : left+56,compact ? 86 : 60,compact ? 22 : 21,primary,700);
        const summary=lines.map((line,i)=>text(line,bodyX,summaryY+i*lineHeight,summarySize,secondary)).join('');
        const divider='<path d="M'+bodyX+' '+(footerY-10)+'H'+(width-left)+'" stroke="'+border+'"/>';
        let footer;
        if (upstream && !compact) {
          footer=badge(item.language,width-89,26,accent,surface)+text(item.repo,bodyX,131,12,muted)+text('Explore repository',width-161,131,12,accent,600)+icon('arrow-up-right',width-34,117,15,accent);
        } else {
          footer=badge(item.language,left,footerY,accent,surface)+text('Explore repository',width-166,footerY+18,12.5,accent,600)+icon('arrow-up-right',width-36,footerY+4,17,accent);
        }
        const title=item.name+' — '+item.description+' '+item.language+'. Explore repository.';
        write('project-'+item.id+'-'+(dark ? 'dark' : 'light')+(compact ? '-compact' : '')+'.svg',width,height,title,background+iconTile+header+summary+divider+footer);
      }
      if (upstream) for (const number of item.prs) {
        const colors=themes[item.theme]; const accent=dark ? colors.dark : colors.light; const surface=dark ? colors.darkSurface : colors.surface;
        const label='PR #'+number; const width=Math.ceil(measure(label,12.5))+48;
        write('pr-'+item.id+'-'+number+'-'+(dark ? 'dark' : 'light')+'.svg',width,30,label,'<rect x=".5" y=".5" width="'+(width-1)+'" height="29" rx="7" fill="'+surface+'" stroke="'+(dark ? '#364457' : colors.border)+'"/>'+icon('git-pull-request',10,7,16,accent)+text(label,34,20,12.5,accent,600));
      }
    }
  }
}
const picture = (item,upstream=false) => ('<a href="https://github.com/'+item.repo+'">\n  <picture>\n    <source media="(max-width: 620px) and (prefers-color-scheme: dark)" srcset="assets/project-'+item.id+'-dark-compact.svg" />\n    <source media="(max-width: 620px)" srcset="assets/project-'+item.id+'-light-compact.svg" />\n    <source media="(prefers-color-scheme: dark)" srcset="assets/project-'+item.id+'-dark.svg" />\n    <img src="assets/project-'+item.id+'-light.svg" width="'+(upstream ? '100%' : '400')+'" alt="'+esc(item.name+' — '+item.description+' '+item.language)+ '" />\n  </picture>\n</a>').replace(/>\s+</g,'><');
let sections='## Things I\'m building\n\n';
for (let i=0;i<config.projects.length;i+=2) sections+='<p>\n'+config.projects.slice(i,i+2).map(item=>picture(item)).join('\n')+'\n</p>\n\n';
sections+='## Projects I contribute to\n\nFixes and improvements in the Java ecosystem.\n\n';
for (const item of config.contributions) {
  sections+=picture(item,true)+'\n\n<p>\n  <picture><source media="(prefers-color-scheme: dark)" srcset="assets/pr-label-dark.svg" /><img src="assets/pr-label-light.svg" height="30" alt="My PRs:" /></picture>\n';
  for (const number of item.prs) sections+='  <a href="https://github.com/'+item.repo+'/pull/'+number+'"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/pr-'+item.id+'-'+number+'-dark.svg" /><img src="assets/pr-'+item.id+'-'+number+'-light.svg" height="30" alt="PR #'+number+'" /></picture></a>\n';
  sections+='</p>\n\n';
}
const readmeFile=new URL('README.md',root);
const readme=fs.readFileSync(readmeFile,'utf8');
fs.writeFileSync(readmeFile,readme.replace(/## Things I'm building[\s\S]*?(?=## Every commit counts)/,sections));
console.log('Generated 28 themed project cards, 12 clickable PR badges, two aligned PR labels, and the README project sections.');
