export default class HomePresenter {
    #view;
    #model;
  
    constructor({ view, model }) {
      this.#view = view;
      this.#model = model;
    }

    async initialShopItems() {
      this.#view.showLoading();
      try {  
        const response = await this.#model.getAllShopItems();

        if (!response.ok) {
          console.error('initialShopItems: response:', response);
          this.#view.populateShopListError(response.message);
          return;
        }
  
        this.#view.populateShopItemsList(response.status, response.data);
      } catch (error) {
        console.error('initialShopItems: error:', error);
        this.#view.populateShopListError(error.message);
      } finally {
        this.#view.hideLoading();
      }
    }
}