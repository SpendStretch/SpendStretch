// AdMob configuration
// Replace with your actual AdMob unit IDs after setup

export const AD_UNIT_IDS = {
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716', // test ID
    android: 'ca-app-pub-3940256099942544/6300978111', // test ID
  },
  interstitial: {
    ios: 'ca-app-pub-3940256099942544/4411468910', // test ID
    android: 'ca-app-pub-3940256099942544/1033173712', // test ID
  },
};

// Track add/update actions for interstitial frequency capping
let actionCount = 0;
let lastInterstitialTime = 0;
const INTERSTITIAL_FREQUENCY = 5;
const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

export function shouldShowInterstitial(): boolean {
  actionCount += 1;
  const now = Date.now();
  const timeSinceLast = now - lastInterstitialTime;

  if (actionCount % INTERSTITIAL_FREQUENCY === 0 && timeSinceLast >= INTERSTITIAL_COOLDOWN_MS) {
    lastInterstitialTime = now;
    return true;
  }
  return false;
}
