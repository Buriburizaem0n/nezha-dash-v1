import { DateTime } from "luxon";

export function initCustomConfig() {
  try {
    const hour = DateTime.now().hour;
    const isNight = hour >= 18 || hour < 6;

    // Use default values if window variables are not already set (e.g. by backend custom_code)
    // although the goal is to hardcode these for "consistency".
    
    window.CustomBackgroundImage = isNight
      ? 'https://loohui.com/wp-content/uploads/images/background.jpg'
      : 'https://loohui.com/wp-content/uploads/images/background_day.jpg';
    
    window.CustomMobileBackgroundImage = window.CustomBackgroundImage;
    window.ForceTheme = isNight ? 'dark' : 'light';

    /* LOGO / 副标题 / 链接 */
    window.CustomLogo = 'https://loohui.com/wp-content/uploads/images/pet.png';
    window.CustomDesc = '树树皆秋色，山山唯落晖';
    window.CustomLinks = JSON.stringify([
      { "link": "https://loohui.com/", "name": "返回Blog", "blank": false }
    ]);

    // Handle internal redirects if needed
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const a = target.closest('a');
      if (a && a.href === 'https://loohui.com/') {
        e.preventDefault();
        window.location.href = a.href;
      }
    });

  } catch (e) {
    console.error('[Nezha custom_config] crash:', e);
  }
}
