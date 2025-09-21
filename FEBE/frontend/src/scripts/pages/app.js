import { getActiveRoute } from '../routes/url-parser';
import { routes } from '../routes/routes';
import { transitionHelper } from '../utils';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;

  constructor({ content, drawerNavigation, drawerButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', (event) => {
      this.#drawerNavigation.classList.toggle('open');
    });

    this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        this.#drawerNavigation.classList.remove('open');

        this.#drawerNavigation.querySelectorAll('a').forEach((item) => {
          item.classList.remove('active');
          item.classList.add('inactive');
        });

        link.classList.add('active');
        link.classList.remove('inactive');
      });
    });
  }

  #updateActiveNavLink() {
    const url = getActiveRoute();
    this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === `#${url}` || (href === '#/' && url === '/')) {
        link.classList.add('active');
        link.classList.remove('inactive');
      } else {
        link.classList.remove('active');
        link.classList.add('inactive');
      }
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    // Get page instance
    const page = route();

    const transition = transitionHelper({
      updateDOM: async () => {
        try {
          this.#content.innerHTML = await page.render();
          await page.afterRender();
          this.#updateActiveNavLink();
        } catch (error) {
          console.error('Error while rendering page:', error);
        }
      },
    });

    transition.ready.catch(console.error);
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
    });
  }
}
