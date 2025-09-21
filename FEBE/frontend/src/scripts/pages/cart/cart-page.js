import { generateCartDetailsOrderTemplate, generateCartItemsTemplate } from "../../template";
import CartPresenter from "./cart-presenter"
import Database from "../../database"

export default class CartPage {
  #presenter = null;
  
  async render() {
      return `
        <section id="cart" class="cart background-section">
          <div class="cart-container">
            <h1 class="section-title">Keranjang Belanja</h1>

            <div class="cart-list-container">
              <div class="cart-list">
                <div class="cart-box cart-item__header">
                  <h3>Daftar Pesanan</h3>
                </div>
              
                <div id="cart-list-display"></div>
              </div>
            
              <div class="cart-box cart-details">
                <h3>Rincian</h3>
                <div id="cart-details-order-container"></div>
                
                <hr />
                <div class="cart-details-order cart-details-total">
                  <p class="cart-details__name">Total</p>
                  <p id="cart-details__total-price" class="cart-details__total-price">-</p>
                </div>
                <hr />
                <button id="cart-details__button" class="button green-button cart-details__button">Beli</button>
              </div>
            </div>
          </div>
        </section>  
      `
  }

  async afterRender() {
    this.#presenter = new CartPresenter({
      view: this,
      dbModel: Database,
    });
    await this.#presenter.initialShopItems();
    this.#deleteItemFromDatabase();
  }
  
  populateShopItemsList(message, items) {
    const shopItemsHTML = items.reduce((acc, item) => {
      return acc.concat(generateCartItemsTemplate(item));
    }, '');
    
    const cartItemHTML = items.reduce((acc, item) => {
      return acc.concat(generateCartDetailsOrderTemplate(item));
    }, '');

    const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

    document.getElementById('cart-list-display').innerHTML = `
      <div class="cart-list-display">${shopItemsHTML}</div>
    `;
    
    document.getElementById('cart-details-order-container').innerHTML = `
      <div class="cart-details-order-container">${cartItemHTML}</div>
    `;

    document.getElementById('cart-details__total-price').textContent = `Rp${totalPrice.toLocaleString('id-ID')}`;
    this.buyButtonEventListener();
  }

  #deleteItemFromDatabase() {
    const cartList = document.getElementById('cart-list-display');

    cartList.addEventListener('click', async (event) => {
      const closeBtn = event.target.closest('.cart-item__close-button');
      if (!closeBtn) return;

      const itemElement = closeBtn.closest('.cart-item');
      const itemId = itemElement?.dataset.itemid;
      if (!itemId) return;

      const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus pesanan Anda?");
      if (!confirmDelete) return;

      await this.#presenter.removeShopItem(itemId);
      await this.#presenter.initialShopItems();
    });
  }

  buyButtonEventListener() {
    document.getElementById('cart-details__button').addEventListener('click', () => {
      alert('Fitur pembelian belum tersedia!');
    });
  }
}
