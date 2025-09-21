export default class ShopPresenter {
  #view;
  #apiModel;
  #dbModel;
  #allItems = [];

  constructor({ view, apiModel, dbModel }) {
    this.#view = view;
    this.#apiModel = apiModel;
    this.#dbModel = dbModel;
  }

  async initialShopItems() {
    this.#view.showLoading();
    try {
      const response = await this.#apiModel.getAllShopItems();
      this.#allItems = response.data;

      if (!response.ok) {
        console.error('initialShopItems: response:', response);
        this.#view.populateShopListError(response.message);
        return;
      }

      this.#view.populateShopItemsList(response.message, this.#allItems);
    } catch (error) {
      console.error('initialShopItems: error:', error);
      this.#view.populateShopListError(error.message);
    } finally {
      this.#view.hideLoading();
    }
  }

  filterItems(searchTerm, activeFilter) {
    let filteredItems = this.#allItems;

    if (searchTerm) {
      filteredItems = filteredItems.filter((item) => item.itemName.toLowerCase().includes(searchTerm));
    }

    if (activeFilter && activeFilter !== 'All Items') {
      filteredItems = filteredItems.filter((item) => item.category && item.category.toLowerCase() === activeFilter);
    }

    if (filteredItems.length === 0) {
      this.#view.populateShopItemsNotFound();
      return;
    }

    this.#view.populateShopItemsList('Filtered items', filteredItems);
  }

  async saveShopItem(itemId) {
    try {
      const shopItem = await this.#apiModel.getShopItemById(itemId);

      const shopItemData = {
        id: itemId,
        ...shopItem.shopItem,
      };

      await this.#dbModel.putShopItem(shopItemData);
      // this.#view.saveToBookmarkSuccessfully('Success to save to Cart');
    } catch (error) {
      console.error('saveShopItem: error:', error);
    }
  }

  async removeShopItem(itemId) {
    try {
      await this.#dbModel.removeShopItem(itemId);
    } catch (error) {
      console.error('removeShopItem: error:', error);
    }
  }

  async isShopItemSaved(itemId) {
    try {
      const item = await this.#dbModel.getShopItemById(itemId);
      return !!item;
    } catch (error) {
      console.error('isShopItemSaved: error:', error);
      return false;
    }
  }
}
