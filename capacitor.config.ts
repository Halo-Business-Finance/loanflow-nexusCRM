import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8075a406180b4cb8aa56775b3192ae75',
  appName: 'loanflow-nexus',
  webDir: 'dist',
  server: {
    url: 'https://8075a406-180b-4cb8-aa56-775b3192ae75.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;