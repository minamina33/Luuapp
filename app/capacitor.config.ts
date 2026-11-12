import type { CapacitorConfig } from '@capacitor/cli';

// iPhone アプリ（Capacitor）の設定
// appId は App Store に登録するまでは変えられる。会社を作ったら、会社のドメインに合わせて決め直す
const config: CapacitorConfig = {
  appId: 'jp.luuapp.luu',
  appName: 'るう',
  webDir: 'dist',
  backgroundColor: '#fbf3ec',
  ios: {
    contentInset: 'never',
  },
};

export default config;
