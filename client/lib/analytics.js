import Plausible from "plausible-tracker";

export function initAnalytics() {
  const { trackPageview } = Plausible({
    domain: "boson.agency",
  });
  trackPageview();
}


