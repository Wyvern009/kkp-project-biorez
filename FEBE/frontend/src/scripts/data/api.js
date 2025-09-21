import BASE_URL from "../config";

const ENDPOINTS = {
    SHOP_ITEMS: `${BASE_URL}/shopItems`,
    SPECIFIED_SHOP_ITEMS: (id) => `${BASE_URL}/shopItems/${id}`,
}

export async function getAllShopItems() {
    const fetchResponse = await fetch(ENDPOINTS.SHOP_ITEMS);
    const json = await fetchResponse.json();

    console.log('getAllShopItems response:', json);

    return {
      ok: fetchResponse.ok,
      message: json.status,
      data: json.data.shopItems,
    }
}

export async function getShopItemById(id) {
  const fetchResponse = await fetch(ENDPOINTS.SPECIFIED_SHOP_ITEMS(id));
  const json = await fetchResponse.json();

  console.log('getShopItemById response:', json);

  return {
    ok: fetchResponse.ok,
    shopItem: json.data.shopItem,
  };
}
