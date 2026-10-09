# Mis Finanzas

App Android (Expo SDK 54 + expo-router) para registrar ingresos, gastos y cuentas. Los datos se guardan en el propio dispositivo (AsyncStorage).

## Desarrollo

```bash
npm install
npm start
```

Abre la app con **Expo Go** en el móvil escaneando el QR, o pulsa `a` para lanzarla en un emulador Android.

## Generar el APK

Cada push a `main` ejecuta el workflow `.github/workflows/build-apk.yml`, que genera un APK de release instalable (artefacto `mis-finanzas-apk`).

Para compilarlo en local (requiere Android SDK y JDK 17):

```bash
npx expo prebuild --platform android --clean
cd android && ./gradlew assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`. Se firma con la clave de debug; para publicarlo en Google Play hay que configurar una clave de firma propia.
