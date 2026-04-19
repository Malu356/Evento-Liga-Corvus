let HEROES_MAP = {};

async function loadHeroes() {
  const response = await fetch("https://api.opendota.com/api/heroes");
  const heroes = await response.json();

  HEROES_MAP = {};

  heroes.forEach(hero => {
    HEROES_MAP[hero.id] = {
      id: hero.id,
      name: hero.localized_name,
      shortName: hero.name.replace("npc_dota_hero_", "")
    };
  });
}

function getHeroData(heroId) {
  return HEROES_MAP[heroId] || null;
}

function getHeroName(heroId) {
  const hero = getHeroData(heroId);
  return hero ? hero.name : `Hero ${heroId}`;
}

function getHeroImage(heroId) {
  const hero = getHeroData(heroId);
  if (!hero) return "";

  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${hero.shortName}.png`;
}