let ITEMS_BY_ID = {};

async function loadItems() {
  const response = await fetch("https://api.opendota.com/api/constants/items");
  const itemsData = await response.json();

  ITEMS_BY_ID = {};

  for (const key in itemsData) {
    const item = itemsData[key];
    if (item.id !== undefined) {
      ITEMS_BY_ID[item.id] = {
        id: item.id,
        name: key,
        displayName: item.dname || key
      };
    }
  }
}

function getItemData(itemId) {
  return ITEMS_BY_ID[itemId] || null;
}

function getItemImage(itemId) {
  const item = getItemData(itemId);
  if (!item) return "";

  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${item.name}.png`;
}