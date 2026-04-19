async function buildHome() {
  document.getElementById("event-name").textContent = EVENT_CONFIG.eventName;

  await loadHeroes();
  const matches = await fetchAllMatches(EVENT_CONFIG.matches);
  const ranking = calculateRanking(matches);

  renderTop3Highlight(ranking, matches);
  renderEventStats(matches, ranking);
  renderEventMvp(matches, ranking);
  renderMetaDoEvento(matches);
  renderHomeRanking(ranking);
}

function calculateRanking(matches) {
  const stats = {};

  for (const accountId in EVENT_CONFIG.players) {
    stats[accountId] = {
      accountId,
      nick: EVENT_CONFIG.players[accountId].nick,
      wins: 0,
      losses: 0,
      mmrDelta: 0,
      matches: 0,
      kills: 0,
      deaths: 0,
      assists: 0
    };
  }

  for (const matchEntry of matches) {
    const match = matchEntry.data;
    const matchConfig = matchEntry.config;

    if (!match.players) continue;

    for (const player of match.players) {
      const accountId = String(player.account_id);

      if (!stats[accountId]) continue;

      const won =
        (player.player_slot < 128 && match.radiant_win) ||
        (player.player_slot >= 128 && !match.radiant_win);

      stats[accountId].matches += 1;
      stats[accountId].kills += player.kills ?? 0;
      stats[accountId].deaths += player.deaths ?? 0;
      stats[accountId].assists += player.assists ?? 0;

      if (won) {
        stats[accountId].wins += 1;
      } else {
        stats[accountId].losses += 1;
      }

      stats[accountId].mmrDelta += getMmrDeltaForPlayer(matchConfig, accountId, won);
    }
  }

  return Object.values(stats).sort((a, b) => {
    if (b.mmrDelta !== a.mmrDelta) return b.mmrDelta - a.mmrDelta;
    return b.wins - a.wins;
  });
}

function getAverageKda(player) {
  const deaths = player.deaths || 0;
  const divisor = deaths === 0 ? 1 : deaths;
  return ((player.kills + player.assists) / divisor).toFixed(2);
}

function getMostPickedHeroForPlayer(matches, accountId) {
  const heroCount = {};

  for (const matchEntry of matches) {
    const match = matchEntry.data;
    const players = Array.isArray(match.players) ? match.players : [];

    const player = players.find(p => String(p.account_id) === String(accountId));
    if (!player) continue;

    const heroId = player.hero_id;
    if (!heroId) continue;

    heroCount[heroId] = (heroCount[heroId] || 0) + 1;
  }

  let bestHeroId = null;
  let bestCount = 0;

  for (const heroId in heroCount) {
    if (heroCount[heroId] > bestCount) {
      bestCount = heroCount[heroId];
      bestHeroId = Number(heroId);
    }
  }

  return {
    heroId: bestHeroId,
    count: bestCount
  };
}

function getTopHeroesOfEvent(matches) {
  const heroCount = {};

  for (const matchEntry of matches) {
    const match = matchEntry.data;
    const players = Array.isArray(match.players) ? match.players : [];

    for (const player of players) {
      if (!EVENT_CONFIG.players[String(player.account_id)]) continue;

      const heroId = player.hero_id;
      if (!heroId) continue;

      heroCount[heroId] = (heroCount[heroId] || 0) + 1;
    }
  }

  return Object.entries(heroCount)
    .map(([heroId, count]) => ({
      heroId: Number(heroId),
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function renderTop3Highlight(ranking, matches) {
  const container = document.getElementById("top3-highlight");
  const top3 = ranking.slice(0, 3);

  if (!top3.length) {
    container.innerHTML = "<p>Nenhum dado encontrado.</p>";
    return;
  }

  container.innerHTML = top3.map((player, index) => {
    const topHero = getMostPickedHeroForPlayer(matches, player.accountId);
    const heroName = topHero.heroId ? getHeroName(topHero.heroId) : "Sem herói";
    const heroImage = topHero.heroId ? getHeroImage(topHero.heroId) : "";
    const medals = ["🥇", "🥈", "🥉"];

    return `
      <article class="top3-card top3-card-${index + 1}">
        <div class="top3-card-glow"></div>

        <div class="top3-card-header">
          <span class="top3-medal">${medals[index]}</span>
          <span class="top3-position">#${index + 1}</span>
        </div>

        ${heroImage ? `
          <div class="top3-hero-image-wrap">
            <img src="${heroImage}" alt="${heroName}" class="top3-hero-image">
          </div>
        ` : ""}

        <div class="top3-content">
          <h3>${player.nick}</h3>
          <p class="top3-hero-name">
            ${heroName}${topHero.count ? ` • ${topHero.count}x` : ""}
          </p>

          <div class="top3-stats">
            <div class="top3-stat">
              <span>MMR</span>
              <strong>${player.mmrDelta >= 0 ? "+" : ""}${player.mmrDelta}</strong>
            </div>
            <div class="top3-stat">
              <span>Winrate</span>
              <strong>${getWinRate(player.wins, player.losses)}</strong>
            </div>
            <div class="top3-stat">
              <span>Partidas</span>
              <strong>${player.matches}</strong>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderEventStats(matches, ranking) {
  const container = document.getElementById("event-stats-grid");

  let radiantWins = 0;
  let direWins = 0;
  const uniquePlayers = new Set();

  for (const matchEntry of matches) {
    const match = matchEntry.data;
    const players = Array.isArray(match.players) ? match.players : [];

    if (match.radiant_win) radiantWins++;
    else direWins++;

    for (const player of players) {
      const accountId = String(player.account_id);
      if (EVENT_CONFIG.players[accountId]) uniquePlayers.add(accountId);
    }
  }

  const leader = ranking[0];

  container.innerHTML = `
  <article class="stat-card">
    <span class="stat-label">🔥 Partidas</span>
    <strong class="stat-value">${matches.length}</strong>
  </article>

  <article class="stat-card">
    <span class="stat-label">👥 Jogadores</span>
    <strong class="stat-value">${uniquePlayers.size}</strong>
  </article>

  <article class="stat-card">
    <span class="stat-label">🌞 Radiant</span>
    <strong class="stat-value">${radiantWins}</strong>
  </article>

  <article class="stat-card">
    <span class="stat-label">🌑 Dire</span>
    <strong class="stat-value">${direWins}</strong>
  </article>

  <article class="stat-card">
    <span class="stat-label">👑 Líder</span>
    <strong class="stat-value">${leader ? leader.nick : "-"}</strong>
  </article>
`;
}

function renderEventMvp(matches, ranking) {
  const container = document.getElementById("event-mvp");

  const eligible = ranking.filter(player => player.matches > 0);

  if (!eligible.length) {
    container.innerHTML = "<p>Nenhum dado encontrado.</p>";
    return;
  }

  const mvp = [...eligible].sort((a, b) => {
    if (b.mmrDelta !== a.mmrDelta) return b.mmrDelta - a.mmrDelta;
    if (Number(getAverageKda(b)) !== Number(getAverageKda(a))) {
      return Number(getAverageKda(b)) - Number(getAverageKda(a));
    }
    return b.wins - a.wins;
  })[0];

  const topHero = getMostPickedHeroForPlayer(matches, mvp.accountId);
  const heroName = topHero.heroId ? getHeroName(topHero.heroId) : "Sem herói";

  container.innerHTML = `
    <div class="mvp-card">
      <div class="mvp-main">
        <span class="mvp-badge">🏆 MVP</span>
        <span class="mvp-crown">👑</span>
        <h4>${mvp.nick}</h4>
        <p class="mvp-sub">${heroName}${topHero.count ? ` • ${topHero.count}x` : ""}</p>
      </div>

      <div class="mvp-stats">
        <div class="mvp-stat">
          <span>MMR</span>
          <strong>${mvp.mmrDelta >= 0 ? "+" : ""}${mvp.mmrDelta}</strong>
        </div>
        <div class="mvp-stat">
          <span>KDA médio</span>
          <strong>${getAverageKda(mvp)}</strong>
        </div>
        <div class="mvp-stat">
          <span>Winrate</span>
          <strong>${getWinRate(mvp.wins, mvp.losses)}</strong>
        </div>
        <div class="mvp-stat">
          <span>Partidas</span>
          <strong>${mvp.matches}</strong>
        </div>
      </div>
    </div>
  `;
}

function renderMetaDoEvento(matches) {
  const container = document.getElementById("meta-evento");
  const topHeroes = getTopHeroesOfEvent(matches);

  if (!topHeroes.length) {
    container.innerHTML = "<p>Nenhum dado encontrado.</p>";
    return;
  }

  container.innerHTML = topHeroes.map((hero, index) => {
    const heroName = getHeroName(hero.heroId);
    const heroImage = getHeroImage(hero.heroId);

    return `
      <article class="meta-card meta-card-${index + 1}">
        <div class="meta-rank">#${index + 1}</div>

        ${heroImage ? `
          <div class="meta-image-wrap">
            <img src="${heroImage}" alt="${heroName}" class="meta-image">
          </div>
        ` : ""}

        <div class="meta-content">
          <h4>${heroName}</h4>
          <p>${hero.count} partida${hero.count > 1 ? "s" : ""}</p>
          <span class="meta-badge">Meta</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderHomeRanking(ranking) {
  const tbody = document.getElementById("home-ranking-body");
  const top5 = ranking.slice(0, 5);

  tbody.innerHTML = top5.map((player, index) => `
    <tr>
      <td>#${index + 1}</td>
      <td>${player.nick}</td>
      <td>${player.wins}</td>
      <td>${player.losses}</td>
      <td>${getWinRate(player.wins, player.losses)}</td>
      <td>${player.matches}</td>
      <td class="${player.mmrDelta >= 0 ? "win" : "loss"}">
        ${player.mmrDelta >= 0 ? "+" : ""}${player.mmrDelta}
      </td>
    </tr>
  `).join("");
}

buildHome();