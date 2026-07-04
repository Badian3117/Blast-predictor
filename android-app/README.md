# BP Guardian

An Android app that combines blood pressure data from your phone and your
Infowear-connected smartwatch into a single, reconciled log — built because
the two sources (watch app vs. phone) don't always agree, and for someone
managing hypertension that gap matters.

## Why this needs a custom app

Infowear (like most white-label watch-companion apps sold on Alibaba) has:

- **No public API or data export.**
- **No Health Connect / Google Fit integration** — so the watch's readings
  never show up next to your phone's own health data automatically.

That means there is no clean "just read two APIs and merge" solution here.
This app instead uses two real data paths and reconciles between them:

1. **Health Connect** (`data/HealthConnectManager.kt`) — the phone-side
   source of truth for anything that *does* get written there: step/exercise
   context (used to flag whether a reading was taken at rest or right after
   activity), heart rate, and any `BloodPressureRecord` some other app on
   your phone contributes now or in the future.
2. **Infowear screen capture** (`accessibility/`) — since Infowear exposes
   nothing programmatically, an opt-in `AccessibilityService` reads the
   systolic/diastolic/pulse numbers directly off Infowear's own screen when
   you open it, the same way a screen reader would. You point it at
   Infowear's package name in Settings so it never inspects any other app.
3. **Manual entry** — typing in a reading (ideally from a validated cuff)
   is always available and always wins over an automated capture when the
   two disagree. See `ui/ManualEntryScreen.kt`.

All three funnel through one place: `data/ReconciliationEngine.kt`. When two
readings land within 5 minutes of each other it either averages them (if
they roughly agree) or keeps the higher-priority source while still
recording that the other one existed — so you can always see *why* a given
log entry shows what it shows (`BpReading.mergedSources`).

Priority order (`data/BpSource.kt`): **manual cuff > Infowear auto-capture ≈
manual watch entry > Health Connect**.

## Setup

1. Open `android-app/` in Android Studio (Koala+ recommended). It will
   generate the Gradle wrapper on first sync — no manual JDK/SDK config
   needed beyond the standard Android Studio setup.
2. Build & install on your phone (`minSdk 28`).
3. Install [Health Connect](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata)
   if it isn't already on your phone (on Android 14+ it's built in), and
   grant the permissions BP Guardian requests on first launch of Settings.
4. In BP Guardian → Settings → **Infowear watch capture**:
   - Tap "Open Accessibility settings to enable" and turn on **BP Guardian**
     under Accessibility → Installed apps.
   - Turn on **Calibration mode**, open Infowear, and navigate to its BP
     result screen. The Settings screen will show you Infowear's package
     name and the raw text BP Guardian sees there.
   - Paste that package name into the "Infowear package name" field and
     save. Turn calibration mode back off.
   - From now on, opening Infowear's result screen automatically logs a
     reading in BP Guardian.
5. Take a cuff reading occasionally and enter it manually — this is what
   keeps the reconciled log anchored to something clinically meaningful
   (see disclaimer below) and is also what the app uses to catch cases
   where the watch is reading badly.

## Project layout

```
app/src/main/java/com/bpguard/monitor/
  data/                  BpReading (Room entity), BpSource, BpCategory (AHA
                         classification), HealthConnectManager,
                         ReconciliationEngine, repository/BpRepository
  accessibility/         InfowearCaptureService (AccessibilityService),
                         InfowearParser (screen-text -> BP heuristics),
                         InfowearCaptureBus (service -> app bridge)
  work/                  HealthConnectSyncWorker (hourly background pull)
  notifications/         BpAlertNotifier (hypertensive-crisis alert)
  ui/                    Dashboard, History, Manual entry, Settings screens
```

## A note on accuracy — please read this given your BP history

Optical (PPG) blood pressure estimation, which is what most of these
smartwatches use, **is not clinically validated** the way an oscillometric
cuff is, and typically requires periodic per-user calibration against a
cuff to stay even reasonably accurate. This app's reconciliation logic is
designed to make the *combined* log more trustworthy than either source
alone — but it cannot make an uncalibrated optical sensor clinically
accurate.

For anything that actually matters for managing hypertension (medication
dosing decisions, discussions with your doctor, deciding whether a reading
is an emergency), treat manually-entered cuff readings as ground truth, and
use an [AHA-validated home BP monitor](https://www.validatebp.org/) if you
don't already have one. The watch data is genuinely useful for *trend*
context (time-of-day patterns, activity correlation) — just not as the
sole basis for clinical decisions. The app will flag any reading at or
above 180/120 mmHg (hypertensive crisis range) with a high-priority
notification regardless of source, but this is not a substitute for
medical advice.
