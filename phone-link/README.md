# Phone Link

An Android app that links your two phones **only when you need it**: with one tap, calls you don't answer on phone A ring on phone B. With a second tap, everything goes back to normal.

## How it works, and why this way

A third-party app cannot pass the audio of a cellular (SIM) call from one phone to another. Android keeps call audio for system apps (`CAPTURE_AUDIO_OUTPUT`), and iOS does not let apps touch cellular calls at all. Any app that claims to bridge a live call this way needs root, or it relays a VoIP copy of the call with lag and drops.

So Phone Link uses the carrier network's own call forwarding, and only switches it on and off for you:

| | Code sent to the carrier | Effect |
|---|---|---|
| **Link** (recommended mode) | `*004*<other number>**20#` | Phone A rings for 20 s. Then the call goes to phone B. Calls also go to B when A is busy, switched off or has no signal. |
| Link, "only if unanswered" | `*61*<number>**20#` | For carriers that reject `*004*`. |
| Link, "all calls" | `*21*<number>#` | Phone A does not ring at all. |
| **Unlink** | `*004*<voicemail>**20#`, or `##004#` | Puts voicemail back (if you entered your voicemail number), or turns forwarding off. |
| Check | `*#61#` / `*#21#` | Your phone shows the real state the carrier holds. |

These are standard GSM codes (3GPP TS 22.030). The app sends them with `TelecomManager.placeCall`, which hands them to the telephony stack as network requests, not as calls.

Advantages over any "bridge" app:
- Calls keep full network quality, with no lag.
- No battery drain and no background service.
- Calls reach phone B even when phone A is off or has no signal.
- No internet and no server needed.

## Three ways to switch the link

1. **In the app**: the big *Link / Unlink* button.
2. **Quick Settings tile**: swipe down, tap the pencil, and add **Phone Link**. Then it's one tap from anywhere.
3. **Remote control by SMS**, for when you left phone A at home and only have phone B. Install the app on both phones, enter each other's number and the same PIN, and turn on *Remote control* on both. On phone B, tap **Link it**. B sends `PHONELINK <pin> ON` to A. A sends the forwarding code to its carrier and replies `PHONELINK-ACK LINKED`, and B shows a notification.

Security of the remote control:
- A only accepts commands sent from the saved partner number **and** carrying the right PIN.
- A always forwards to the **saved** partner number, never to the sender. So a spoofed SMS can at most switch forwarding to *your own* other phone on or off. It can never send your calls to a stranger.

The app is symmetric: install it on both phones, and each one can forward to the other.

## Install

1. Open the repository's **Actions** tab, then the latest **Phone Link (Android)** run. Download the **phone-link-apk** artifact and unzip it.
2. Copy `app-debug.apk` to each phone and open it. Allow "install unknown apps" for your file manager or browser when Android asks.
3. Open Phone Link and allow **Phone** (needed to send the codes) and **Notifications**.
4. Only for SMS remote control: Android 13 and later block SMS permissions for apps installed outside the Play Store. Go to **Settings → Apps → Phone Link → ⋮ → Allow restricted settings**, then turn on remote control again.

To build it yourself, use Android Studio, or run `./gradlew assembleDebug` in this folder (needs JDK 17 and the Android SDK).

## First-time setup (do this once, with both phones in hand)

1. On phone A, enter phone B's number in **international format** (`+212…`, `+33…`). Your SIMs are on different carriers, and the international format always routes correctly.
2. Tap **Link**. Your carrier shows a message within a few seconds, such as "Call forwarding registered". Call phone A from a third phone and check that the call reaches B after the delay.
3. Tap **Check with carrier** to see the state the network actually holds.
4. Tap **Unlink**, and check that calls stay on A.
5. Do the same on phone B if you want the link to work in the other direction too.

## Things to know

- **Forwarded calls may be billed.** With two different carriers, phone A's carrier usually charges the forwarded leg (A → B) as an outgoing call from A. Check your plan, especially if one SIM is roaming. Forwarding to a foreign number can cost international rates.
- **Voicemail.** Most carriers use conditional forwarding to send missed calls to voicemail. Linking replaces that. If you enter your voicemail number in the app, unlinking restores it. Your carrier can give you the number; on most phones you can also find it under *Phone → Settings → Voicemail*.
- **The app cannot read the carrier's reply.** Android shows that reply only to you. The "Linked" state in the app is the last request it sent. *Check with carrier* gives the truth.
- **If `*004*` is rejected**, choose "Only if unanswered" (`*61*`). A few carriers, and some prepaid plans, don't allow forwarding at all. Then no app can do this, and you should ask your carrier.
- **Dual SIM**: choose which SIM's calls to forward under *SIM to use*.
- **Ring delay**: 5–30 s (default 20 s). Some carriers ignore the timer and use their own.

## Code layout

```
app/src/main/java/com/badian/phonelink/
├── core/                 pure Kotlin, unit-tested on the JVM
│   ├── ForwardingCodes.kt  builds the GSM codes
│   ├── PhoneNumbers.kt     cleaning and matching numbers
│   └── RemoteCommand.kt    SMS protocol and PIN check
├── Forwarder.kt          sends the codes (TelecomManager.placeCall)
├── SmsReceiver.kt        remote control
├── LinkTileService.kt    Quick Settings tile
├── MainActivity.kt       settings and status screen
├── Prefs.kt, Sms.kt, Notifier.kt
```

There are no third-party dependencies, only the Android framework. `minSdk` is 26 (Android 8.0) and `targetSdk` is 35.
