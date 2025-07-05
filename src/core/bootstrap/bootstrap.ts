import { fadeWith } from "../animations";
import { Utils } from "../ui/ui";

/**
 * Load a route with animations
 *
 * @param {string} route route name without prefix
 * @param {HTMLElement} content HTMLElement to load
 */
export async function load(
  route: string,
  content: HTMLElement,
): Promise<HTMLElement> {
  const split = route.split("/");
  const isDeep = split.length > 1;

  const Component = customElements.get("ui-" + split[0]);
  content.classList.remove("full-width");

  const NotFound = customElements.get("ui-not-found");

  // @tool : disable shadow-root on pages
  /* Component.prototype.createRenderRoot = function() {
        return this;
    };*/

  if (content.firstElementChild) {
    content.removeChild(content.firstElementChild);
  }

  const loaded = Component
    ? new Component(isDeep ? split[1] : undefined)
    : new NotFound(route);

  content.appendChild(loaded);

  if (!Utils.animationsReduced()) {
    const config = fadeWith(200, true);
    content.animate(config.effect, config.options);
  }

  window.scrollTo(0, 0);

  const handle = window.requestAnimationFrame(async () => {
    if (!loaded) {
      cancelAnimationFrame(handle);
      return;
    }

    const pageContent = loaded.querySelector(".animated");
    if (!pageContent) {
      cancelAnimationFrame(handle);
      return;
    }

    const animation = fadeWith(1000, true);
    const content = pageContent.animate(animation.effect, animation.options);
    await content.finished;
  });

  return loaded;
}
