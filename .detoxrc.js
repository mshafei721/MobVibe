// Detox E2E Testing Configuration
// Mobile app implementation deferred - this configuration will be used when app development begins

module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/config.json',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/MobVibe.app',
      build: 'xcodebuild -workspace ios/MobVibe.xcworkspace -scheme MobVibe -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MobVibe.app',
      build: 'xcodebuild -workspace ios/MobVibe.xcworkspace -scheme MobVibe -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_7_API_34',
      },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: false,
    },
    launchApp: 'auto',
    cleanup: {
      shutdownDevice: false,
    },
  },
  artifacts: {
    rootDir: 'e2e/artifacts',
    plugins: {
      log: 'failing',
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
        takeWhen: {
          testStart: false,
          testDone: true,
          testFailure: true,
        },
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      instruments: {
        enabled: false,
      },
    },
  },
  logger: {
    level: 'info',
    overrideConsole: true,
  },
};
