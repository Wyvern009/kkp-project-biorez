import { openDB } from 'idb';
 
const DATABASE_NAME = 'biorez';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'saved-order';
 
const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database) => {
    database.createObjectStore(OBJECT_STORE_NAME, {
      keyPath: 'id',
    });
  },
});

const Database = {
  async putShopItem(shopItem) {
    if (!Object.hasOwn(shopItem, 'id')) {
      throw new Error('`id` is required to save.');
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, shopItem);
  },

  async getAllShopItems() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async getShopItemById(id) {
    return (await dbPromise).get(OBJECT_STORE_NAME, id);
  },

  async removeShopItem(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },
};
export default Database;