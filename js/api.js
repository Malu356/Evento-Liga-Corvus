async function fetchMatch(matchId) {
  const url = `https://api.opendota.com/api/matches/${matchId}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Erro ao buscar match ${matchId}`);
  }

  return await response.json();
}

async function fetchAllMatches(matchesConfig) {
  const results = [];

  for (const matchConfig of matchesConfig) {
    try {
      const data = await fetchMatch(matchConfig.matchId);

      results.push({
        config: matchConfig,
        data
      });
    } catch (error) {
      console.error("Erro ao buscar partida:", matchConfig.matchId, error);
    }
  }

  return results;
}