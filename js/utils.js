function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "-";

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getWinRate(wins, losses) {
  const total = wins + losses;
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

function countdownTo(dateString) {
  const target = new Date(dateString).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return "EVENTO ENCERRADO";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPlayerNick(accountId) {
  return EVENT_CONFIG.players[String(accountId)]?.nick || `ID ${accountId}`;
}

function getPlayerNickOrId(accountId) {
  return EVENT_CONFIG.players[String(accountId)]?.nick || `Sem nome (${accountId})`;
}

function getMmrType(matchConfig, accountId) {
  return matchConfig.mmrType?.[String(accountId)] || "normal";
}

function getMmrDeltaForPlayer(matchConfig, accountId, won) {
  const type = getMmrType(matchConfig, accountId);
  const base = won ? EVENT_CONFIG.mmrWin : EVENT_CONFIG.mmrLoss;

  if (type === "double") {
    return base * 2;
  }

  return base;
}