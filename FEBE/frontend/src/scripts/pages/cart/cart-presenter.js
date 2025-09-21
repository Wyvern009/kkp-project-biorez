export default class CartPresenter {
  #view;
  #dbModel;
 
  constructor({ view, dbModel }) {
    this.#view = view;
    this.#dbModel = dbModel;
  }
 
  async initialShopItems() {
    try {
      const listOfShopItems = await this.#dbModel.getAllShopItems();
      const message = 'Berhasil menambahkan pesanan.';
      
      this.#view.populateShopItemsList(message, listOfShopItems);
    } catch (error) {
      console.error('initialShopItems: error:', error);
    } 
  }

  async removeShopItem(itemId) {
    try {
      await this.#dbModel.removeShopItem(itemId);
      console.log(`Item dengan ID ${itemId} berhasil dihapus.`);
    } catch (error) {
      console.error('removeShopItem: error:', error);
    }
  }
}