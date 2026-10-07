import fs from 'node:fs';

const bundle = new URL('../.tools/arcade.mjs', import.meta.url);
const source = fs.readFileSync(bundle, 'utf8');
const original = 'de(t,{x:0,y:0}),de(t,{x:51,y:5})';
const players = 'ue(1,"Bomberman",{x:0,y:0},"right"),ue(2,"Plunder Bomber",{x:52,y:6},"left")';
if (source.split(original).length !== 2 || source.split(players).length !== 2) {
  throw new Error('Pinned Bomberman spawn initialization changed; inspect the bundle before updating.');
}

const chooseSpawns = `
function profileChooseBombermanSpawns(grid) {
  const empty = (x, y) => grid[x]?.[y]?.commitsCount === 0;
  const pocket = (right, other) => {
    for (let x = right ? grid.length - 2 : 0; right ? x >= 0 : x < grid.length - 1; x += right ? -1 : 1) {
      for (let y = right ? grid[0].length - 2 : 0; right ? y >= 0 : y < grid[0].length - 1; y += right ? -1 : 1) {
        if (![empty(x, y), empty(x + 1, y), empty(x, y + 1), empty(x + 1, y + 1)].every(Boolean)) continue;
        const spawn = right ? { x: x + 1, y: y + 1 } : { x, y };
        if (!other || Math.abs(spawn.x - other.x) + Math.abs(spawn.y - other.y) >= 3) return spawn;
      }
    }
    throw new Error('No clear 2x2 area is available for Bomberman spawning.');
  };
  const first = pocket(false);
  const corner = { x: grid.length - 1, y: grid[0].length - 1 };
  const safeCorner = empty(corner.x, corner.y) && (
    (empty(corner.x - 1, corner.y) && (empty(corner.x - 2, corner.y) || empty(corner.x - 1, corner.y - 1))) ||
    (empty(corner.x, corner.y - 1) && (empty(corner.x, corner.y - 2) || empty(corner.x - 1, corner.y - 1)))
  );
  const second = safeCorner && Math.abs(corner.x - first.x) + Math.abs(corner.y - first.y) >= 3
    ? corner : pocket(true, first);
  return { first, second };
}
`;

const patched = source
  .replace(original, 't.__profileSpawns=profileChooseBombermanSpawns(t.grid)')
  .replace(players, 'ue(1,"Bomberman",t.__profileSpawns.first,"right"),ue(2,"Plunder Bomber",t.__profileSpawns.second,"left")');
fs.writeFileSync(bundle, chooseSpawns + patched);
console.log('Kept all contribution cells as obstacles and selected safe Bomberman spawn areas.');
