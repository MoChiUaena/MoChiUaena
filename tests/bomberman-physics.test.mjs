import assert from 'node:assert/strict';
import test from 'node:test';
import { ArcadeRenderer } from '../.tools/arcade.mjs';

test('bombs a contribution before a player enters its cell', async () => {
  const friday = new Date();
  friday.setUTCHours(0, 0, 0, 0);
  friday.setUTCDate(friday.getUTCDate() - friday.getUTCDay() - 2);
  const saturday = new Date(friday);
  saturday.setUTCDate(friday.getUTCDate() + 1);
  const contributionDays = [
    { date: friday.toISOString().slice(0, 10), contributionCount: 97, contributionLevel: 'FOURTH_QUARTILE', color: '#216e39' },
    { date: saturday.toISOString().slice(0, 10), contributionCount: 86, contributionLevel: 'THIRD_QUARTILE', color: '#30a14e' },
  ];
  const originalFetch = globalThis.fetch;
  const originalRandom = Math.random;
  globalThis.fetch = async url => {
    assert.equal(String(url), 'https://api.github.com/graphql');
    return { ok: true, json: async () => ({
      data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays }] } } } },
    }) };
  };

  try {
    for (const [theme, colors] of [
      ['github', ['#216e39', '#30a14e']],
      ['github-dark', ['#39d353', '#26a641']],
    ]) {
      let seed = 12345;
      Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
      let svg = '';
      const renderer = new ArcadeRenderer({
        game: 'bomberman', platform: 'github', username: 'MoChiUaena', gameTheme: theme,
        githubSettings: { accessToken: 'fixture-only' }, svgCallback: output => { svg = output; },
      });
      const store = await renderer.start();
      assert.equal(store.gameHistory[0].players.length, 2);
      assert.equal(store.initialColors[51][5], colors[0], `${theme} erased Friday before the game`);
      assert.equal(store.initialColors[51][6], colors[1], `${theme} erased Saturday before the game`);
      assert.match(svg, new RegExp(`<rect id="c-51-5"[^>]* fill="${colors[0]}"`));
      assert.match(svg, new RegExp(`<rect id="c-51-6"[^>]* fill="${colors[1]}"`));
      for (const day of [5, 6]) {
        const cell = svg.match(new RegExp(`<rect id="c-51-${day}"[^>]*>[\\s\\S]*?<\\/rect>`))?.[0];
        assert.match(cell, /<animate attributeName="fill"/, `${theme} did not animate the bombed contribution`);
      }

      const destroyedFriday = store.cellEvents.find(event => event.x === 51 && event.y === 5);
      const destroyedSaturday = store.cellEvents.find(event => event.x === 51 && event.y === 6);
      assert.ok(destroyedFriday, `${theme} did not bomb Friday's contribution`);
      assert.ok(destroyedSaturday, `${theme} did not bomb Saturday's contribution`);
      const firstCrossing = store.gameHistory.findIndex(snapshot => {
        const player = snapshot.players.find(candidate => candidate.id === 2);
        return player?.x === 51 && player?.y === 5;
      });
      assert.ok(firstCrossing > destroyedFriday.frameIndex, `${theme} crossed Friday before bombing it`);
      assert.ok(store.gameHistory.some(snapshot => snapshot.bombs.some(bomb => bomb.ownerId === 2)));
      assert.match(svg, /animateTransform/);
    }
  } finally {
    globalThis.fetch = originalFetch;
    Math.random = originalRandom;
  }
});

test('spawns in an open pocket when the current weekend fills the corner', async () => {
  const sunday = new Date();
  sunday.setUTCHours(0, 0, 0, 0);
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  const friday = new Date(sunday);
  friday.setUTCDate(sunday.getUTCDate() + 5);
  const saturday = new Date(sunday);
  saturday.setUTCDate(sunday.getUTCDate() + 6);
  const contributionDays = [
    { date: friday.toISOString().slice(0, 10), contributionCount: 97, contributionLevel: 'FOURTH_QUARTILE', color: '#216e39' },
    { date: saturday.toISOString().slice(0, 10), contributionCount: 86, contributionLevel: 'THIRD_QUARTILE', color: '#30a14e' },
  ];
  const originalFetch = globalThis.fetch;
  const originalRandom = Math.random;
  globalThis.fetch = async url => {
    assert.equal(String(url), 'https://api.github.com/graphql');
    return { ok: true, json: async () => ({
      data: { user: { contributionsCollection: { contributionCalendar: { weeks: [{ contributionDays }] } } } },
    }) };
  };
  let seed = 12345;
  Math.random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  try {
    const renderer = new ArcadeRenderer({
      game: 'bomberman', platform: 'github', username: 'MoChiUaena', gameTheme: 'github',
      githubSettings: { accessToken: 'fixture-only' }, svgCallback: () => {},
    });
    const store = await renderer.start();
    const player = store.gameHistory[0].players.find(candidate => candidate.id === 2);
    assert.equal(store.initialColors[52][5], '#216e39');
    assert.equal(store.initialColors[52][6], '#30a14e');
    assert.equal(store.initialColors[player.x][player.y], '#ebedf0', 'player spawned inside a contribution');
  } finally {
    globalThis.fetch = originalFetch;
    Math.random = originalRandom;
  }
});
