import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const assets=new URL('assets/',root);
const config=JSON.parse(fs.readFileSync(new URL('config/toolbox-assets.json',root),'utf8'));
const font='Segoe UI, Arial, sans-serif';
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const palettes={
  orange:{light:'#b65d10',dark:'#ffbb78',surface:'#fff6ec',darkSurface:'#332519',border:'#efd2b4',end:'#e99639'},
  blue:{light:'#0969da',dark:'#79b8ff',surface:'#edf5ff',darkSurface:'#13253b',border:'#bdd5f4',end:'#36a3df'},
  purple:{light:'#7540c8',dark:'#c4a0ff',surface:'#f5efff',darkSurface:'#271d3d',border:'#d8c5ed',end:'#aa68d3'},
  teal:{light:'#087c80',dark:'#62d2ca',surface:'#ebf9f6',darkSurface:'#102c2a',border:'#b7ddd7',end:'#2bab98'},
};
const icon=(name,x,y,size,color)=>{
  const source=fs.readFileSync(new URL('icons/'+name+'.svg',assets),'utf8');
  const paths=source.replace(/<svg[\s\S]*?>/,'').replace(/<\/svg>\s*$/,'');
  return '<g transform="translate('+x+' '+y+') scale('+(size/24)+')" fill="none" stroke="'+color+'" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths+'</g>';
};
const text=(value,x,y,size,color,weight=400,extra='')=>'<text x="'+x+'" y="'+y+'" font-family="'+font+'" font-size="'+size+'" font-weight="'+weight+'" fill="'+color+'" '+extra+'>'+esc(value)+'</text>';
for(const category of config.categories){
  for(const dark of [false,true]){
    for(const compact of [false,true]){
      const width=compact?300:832;
      const columns=compact?(category.items.length===4?2:3):category.items.length;
      const rows=Math.ceil(category.items.length/columns);
      const height=compact?86+rows*76:116;
      const palette=palettes[category.theme];
      const accent=dark?palette.dark:palette.light;
      const surface=dark?palette.darkSurface:palette.surface;
      const primary=dark?'#edf3fb':'#1f2328';
      const secondary=dark?'#c1cbd8':'#505e6c';
      const border=dark?'#364457':palette.border;
      const title=category.title+' — '+category.items.map(item=>item.name).join(', ');
      let body='<defs><linearGradient id="surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+surface+'"/><stop offset="1" stop-color="'+(dark?'#151c27':'#ffffff')+'"/></linearGradient><linearGradient id="edge" x1="0" x2="0" y1="0" y2="1"><stop stop-color="'+accent+'"/><stop offset="1" stop-color="'+palette.end+'"/></linearGradient></defs><rect x="1" y="1" width="'+(width-2)+'" height="'+(height-2)+'" rx="13" fill="url(#surface)" stroke="'+border+'"/><rect x="1" y="16" width="4" height="'+(height-32)+'" rx="2" fill="url(#edge)"/>';
      body+='<rect x="'+(compact?20:24)+'" y="'+(compact?18:34)+'" width="38" height="38" rx="10" fill="'+surface+'" stroke="'+border+'"/>'+icon(category.icon,compact?28:32,compact?26:42,22,accent);
      body+=text(category.title,compact?70:77,compact?35:52,compact?20:21,primary,700)+text(category.subtitle,compact?70:77,compact?56:75,compact?12:11.5,secondary);
      if(!compact) body+='<path d="M242 22V94" stroke="'+border+'"/>';
      const start=compact?18:256;
      const area=width-start-(compact?18:20);
      const cell=area/columns;
      category.items.forEach((item,index)=>{
        const col=index%columns;
        const row=Math.floor(index/columns);
        const inset=compact&&row===rows-1?(columns-(category.items.length-row*columns))/2:0;
        const center=start+cell*(col+inset+.5);
        const top=compact?82+row*76:21;
        body+='<rect x="'+(center-22)+'" y="'+top+'" width="44" height="44" rx="10" fill="#ffffff" stroke="'+(dark?'#465365':'#e2e8ee')+'"/>';
        if(item.asset){
          const svg=fs.readFileSync(new URL(item.asset,assets));
          body+='<image x="'+(center-15)+'" y="'+(top+7)+'" width="30" height="30" href="data:image/svg+xml;base64,'+svg.toString('base64')+'"/>';
        }else body+=icon(item.icon,center-15,top+7,30,palette.light);
        body+=text(item.name,center,top+65,compact?14:13,secondary,500,'text-anchor="middle"');
      });
      const file='toolbox-'+category.id+'-'+(dark?'dark':'light')+(compact?'-compact':'')+'.svg';
      fs.writeFileSync(new URL(file,assets),'<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+esc(title)+'"><title>'+esc(title)+'</title>'+body+'</svg>\n');
    }
  }
}
let section='## My toolbox\n\n';
for(const category of config.categories){
  const alt=category.title+' — '+category.items.map(item=>item.name).join(', ');
  section+='<p><picture><source media="(max-width: 620px) and (prefers-color-scheme: dark)" srcset="assets/toolbox-'+category.id+'-dark-compact.svg" /><source media="(max-width: 620px)" srcset="assets/toolbox-'+category.id+'-light-compact.svg" /><source media="(prefers-color-scheme: dark)" srcset="assets/toolbox-'+category.id+'-dark.svg" /><img src="assets/toolbox-'+category.id+'-light.svg" width="100%" alt="'+esc(alt)+'" /></picture></p>\n\n';
}
const readmeFile=new URL('README.md',root);
let readme=fs.readFileSync(readmeFile,'utf8').replace(/## My toolbox[\s\S]*?(?=## Things I'm building)/,section);
if(!readme.includes('Simple Icons')) readme=readme.replace('- Interface icons:', '- MCP icon: [Simple Icons](https://github.com/simple-icons/simple-icons)\n- Interface icons:');
fs.writeFileSync(readmeFile,readme);
console.log('Generated 16 responsive toolbox strips for 18 verified technologies and tools.');
