import HomePage from "../pages/home/home-page";
import ShopPage from "../pages/shop/shop-page";
import Scanner from "../pages/scanner/scanner-page";
import CartPage from "../pages/cart/cart-page";
import BioporePage from "../pages/biopori/biopori-page";

export const routes = {
  '/': () => new HomePage(),
  '/shop': () => new ShopPage(),
  '/scanner': () => new Scanner(),
  '/cart': () => new CartPage(),
  '/biopore': () => new BioporePage(),
};
