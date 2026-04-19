function getUnknownIds(matchPlayers) {
  const unknown = [];

  for (const player of matchPlayers) {
    const accountId = String(player.account_id);
    if (!EVENT_CONFIG.players[accountId] && !unknown.includes(accountId)) {
      unknown.push(accountId);
    }
  }

  return unknown;
}

function renderPlayerCard(player, match, matchConfig) {
  const accountId = String(player.account_id);

  const won =
    (player.player_slot < 128 && match.radiant_win) ||
    (player.player_slot >= 128 && !match.radiant_win);

  const mmrType = getMmrType(matchConfig, accountId);
  const mmrDelta = getMmrDeltaForPlayer(matchConfig, accountId, won);

  const items = [
    player.item_0,
    player.item_1,
    player.item_2,
    player.item_3,
    player.item_4,
    player.item_5
  ];

  const heroName = getHeroName(player.hero_id);
  const heroImage = getHeroImage(player.hero_id);

  return `
    <article class="stratz-player-card ${won ? "is-win" : "is-loss"}">
      <div class="hero-thumb-wrap">
        ${heroImage ? `<img class="hero-thumb" src="${heroImage}" alt="${heroName}">` : ""}
      </div>

      <div class="stratz-top-row">
        <span class="stratz-result-badge ${won ? "result-win" : "result-loss"}">
          ${won ? "WIN" : "LOSS"}
        </span>
        <span class="stratz-mmr-badge ${mmrDelta >= 0 ? "positive" : "negative"}">
          ${mmrDelta >= 0 ? "+" : ""}${mmrDelta}
        </span>
      </div>

      <div class="stratz-hero-name" title="${heroName}">
        ${heroName}
      </div>

      <div class="stratz-kda">
        ${player.kills ?? 0} / ${player.deaths ?? 0} / ${player.assists ?? 0}
      </div>

      <div class="stratz-networth">
        Net Worth: ${player.net_worth ?? "-"}
      </div>

      <div class="stratz-name" title="${getPlayerNickOrId(accountId)}">
        ${getPlayerNickOrId(accountId)}
      </div>

      <div class="stratz-badges">
        <span class="mini-badge ${mmrType === "double" ? "badge-double" : "badge-normal"}">
          ${mmrType === "double" ? "MMR 2X" : "MMR NORMAL"}
        </span>
      </div>

      <div class="stratz-items">
        ${items.map(item => {
          const img = (item !== null && item !== undefined) ? getItemImage(item) : "";

          return `
            <div class="stratz-item-slot">
              ${img ? `<img src="${img}" alt="item">` : ""}
            </div>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function buildMatchPlayersHtml(match, matchConfig) {
  const players = Array.isArray(match.players) ? match.players : [];

  const radiant = players.filter(p => p.player_slot < 128);
  const dire = players.filter(p => p.player_slot >= 128);

  return `
    <div class="stratz-vs-wrapper">
      <div class="stratz-vs-inner">
        <div class="stratz-team-row">
          ${radiant.map(player => renderPlayerCard(player, match, matchConfig)).join("")}
        </div>

        <div class="stratz-vs-center">VS</div>

        <div class="stratz-team-row">
          ${dire.map(player => renderPlayerCard(player, match, matchConfig)).join("")}
        </div>
      </div>
    </div>
  `;
}

async function buildMatchesPage() {
  const container = document.getElementById("matches-list");

  if (!container) return;

  container.innerHTML = "<p>Buscando partidas...</p>";

  try {
    await loadHeroes();
    await loadItems();

    const matches = await fetchAllMatches(EVENT_CONFIG.matches);

    if (!matches.length) {
      container.innerHTML = "<p>Nenhuma partida encontrada.</p>";
      return;
    }

    const allUnknownIds = new Set();

    const matchesHtml = matches.map((matchEntry, index) => {
      const match = matchEntry.data;
      const matchConfig = matchEntry.config;

      const players = Array.isArray(match.players) ? match.players : [];
      const unknownIds = getUnknownIds(players);

      unknownIds.forEach(id => allUnknownIds.add(id));

      const radiantName = matchConfig.teamA || "Radiant";
      const direName = matchConfig.teamB || "Dire";

      const radiantWin = !!match.radiant_win;
      const winnerName = radiantWin ? radiantName : direName;

      const playersHtml = buildMatchPlayersHtml(match, matchConfig);

      return `
        <details class="match-premium-card" ${index === 0 ? "open" : ""}>
          <summary class="match-premium-summary">
            <div class="match-summary-main">
              <div class="match-summary-top">
                <span class="match-chip">PARTIDA ${index + 1}</span>
                <span class="match-chip subtle">ID ${match.match_id}</span>
                <span class="match-chip subtle">${winnerName} venceu</span>
              </div>

              <div class="match-versus-row">
                <div class="team-name ${radiantWin ? "winner-team" : ""}">
                  ${radiantName}
                </div>

                <div class="versus-center">
                  <div class="match-score">
                    <strong>${match.radiant_score ?? "-"}</strong>
                    <span>VS</span>
                    <strong>${match.dire_score ?? "-"}</strong>
                  </div>
                  <p class="small">${formatDuration(match.duration)} • clique para expandir</p>
                </div>

                <div class="team-name ${!radiantWin ? "winner-team" : ""}">
                  ${direName}
                </div>
              </div>
            </div>
          </summary>

          <div class="match-premium-body">
            <div class="match-info-strip">
              <div class="info-pill">
                <span>Duração</span>
                <strong>${formatDuration(match.duration)}</strong>
              </div>

              <div class="info-pill">
                <span>Resultado</span>
                <strong>${winnerName}</strong>
              </div>

              <div class="info-pill">
                <span>Score</span>
                <strong>${match.radiant_score ?? "-"} x ${match.dire_score ?? "-"}</strong>
              </div>
            </div>

            ${unknownIds.length > 0 ? `
              <div class="unknown-ids-box unknown-ids-box-modern">
                <h4>IDs novos encontrados nesta partida</h4>
                <p class="small">Adicione no <strong>config.js</strong> para exibir o nick corretamente.</p>
                <div class="unknown-ids-list">
                  ${unknownIds.map(id => `<span>${id}</span>`).join("")}
                </div>
              </div>
            ` : ""}

            ${playersHtml}
          </div>
        </details>
      `;
    }).join("");

    const unknownBlock = allUnknownIds.size > 0
      ? `
        <div class="unknown-global-box">
          <h3>Jogadores sem nome no config.js</h3>
          <p class="small">Copie e cole estes IDs na lista de players:</p>
          <div class="unknown-global-code">
            ${Array.from(allUnknownIds).map(id => `<p>"${id}": { nick: "NOME_AQUI" },</p>`).join("")}
          </div>
        </div>
      `
      : "";

    container.innerHTML = unknownBlock + matchesHtml;
  } catch (error) {
    console.error("Erro ao montar página de partidas:", error);
    container.innerHTML = `<p>Erro ao carregar partidas: ${error.message}</p>`;
  }
}

buildMatchesPage();