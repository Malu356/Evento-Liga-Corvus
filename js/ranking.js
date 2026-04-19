function calculateRanking(matches) {
  const stats = {};

  for (const accountId in EVENT_CONFIG.players) {
    stats[accountId] = {
      accountId,
      nick: EVENT_CONFIG.players[accountId].nick,
      wins: 0,
      losses: 0,
      mmrDelta: 0,
      matches: 0
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

function getRankingRowClass(index) {
  if (index === 0) return "ranking-row ranking-row-gold";
  if (index === 1) return "ranking-row ranking-row-silver";
  if (index === 2) return "ranking-row ranking-row-bronze";
  return "ranking-row";
}

async function buildRankingPage() {
  const matches = await fetchAllMatches(EVENT_CONFIG.matches);
  const ranking = calculateRanking(matches);

  const tbody = document.getElementById("ranking-body");

  tbody.innerHTML = ranking.map((player, index) => `
    <tr class="${getRankingRowClass(index)}">
      <td>
        <span class="ranking-position">#${index + 1}</span>
      </td>
      <td>
        <div class="ranking-player-cell">
          <span class="ranking-player-name">${player.nick}</span>
        </div>
      </td>
      <td>${player.wins}</td>
      <td>${player.losses}</td>
      <td>${getWinRate(player.wins, player.losses)}</td>
      <td>${player.matches}</td>
      <td class="${player.mmrDelta >= 0 ? "win" : "loss"} ranking-mmr-cell">
        ${player.mmrDelta >= 0 ? "+" : ""}${player.mmrDelta}
      </td>
    </tr>
  `).join("");
}

buildRankingPage();