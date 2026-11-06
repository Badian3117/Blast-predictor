# Phone Link

An Android app that links your two phones **only when you need it**. Two ways to link, chosen in the app:

| | **Call alerts** (default, free) | **Call forwarding** |
|---|---|---|
| What happens | A call rings on phone A → phone B shows "📞 Call on your other phone: Ahmed (+212…)" with a **Call back** button | Unanswered calls on A ring on B, and you answer them there |
| Cost | Nothing (uses mobile data or Wi-Fi, a few hundred bytes per call) | Forwarded minutes are often billed by A's carrier |
| Caller sees | Your call back comes from B's number | They reached A's number |
| Works when A is off or has no signal | No, A must be on and online (or use the SMS fallback) | Yes, the network does it |

## Call alerts: how they work

1. **Detecting the call on phone A.** On Android 10 and later, Phone Link registers as the phone's *caller ID & spam* app (the `CALL_SCREENING` role). Android then hands it each incoming call's number. The app answers "allow" immediately, so it never blocks, silences or delays a call. There is no background service: Android starts the app only when a call arrives, so it costs no battery. Android 8–9 use the phone-state broadcast instead.
2. **Sending the alert.** Phone A posts a small JSON message to **[ntfy](https://ntfy.sh)**, a free, open-source push service with no account. It goes to a random private topic, e.g. `phonelink-k7m2q9…`.
3. **Receiving it on phone B.** Phone B runs the free **ntfy** app ([Play Store](https://play.google.com/store/apps/details?id=io.heckel.ntfy) / [F-Droid](https://f-droid.org/packages/io.heckel.ntfy/)), subscribed to that topic. The alert arrives in a second or two, at high priority, with a **Call back** button. Phone B does not need Phone Link, unless you also want the SMS remote control.

**Why not WhatsApp or Bluetooth?** Apps cannot send WhatsApp messages by themselves from a personal account. The official WhatsApp Business API needs a separate business number and charges for the messages a business starts. Tools that automate the WhatsApp screen break its terms and can get your number banned. Bluetooth reaches only about 10 m, so it fails exactly when the phones are apart.

**Privacy.** On the public `ntfy.sh` server, the caller's name and number pass through ntfy's servers. Anyone who knows your topic name can read your alerts, and ntfy.sh keeps them for about 12 hours. The topic has about 100 random bits, so it cannot be guessed. Keep it private, and tap **New topic** if it leaks. For full control, [run your own ntfy server](https://docs.ntfy.sh/install/) and enter its address in the app.

**No internet on phone A?** Turn on *If there's no internet, send an SMS instead*. Your plan may charge for that SMS.

### Setting up alerts

1. Install Phone Link on phone A, open it, and keep **Send an alert to my other phone** selected.
2. Tap **Allow call detection**, and accept *Phone Link* as the caller ID & spam app. Also allow **Contacts**: without it, Android hides calls from your contacts from the app.
   - Android allows only one caller ID & spam app. If you use Truecaller or a similar app for that, they cannot both hold the role.
3. On phone B, install **ntfy**. Tap **+**, enter the topic shown in Phone Link (use **Copy** and send it to yourself), and keep the server `ntfy.sh`. In ntfy's settings, allow its notifications to make sound.
4. On phone A, tap **Send a test alert**. It should appear on B.
5. Tap **Link** whenever you leave phone A behind, and **Unlink** when you're back. You can also use the Quick Settings tile, or the SMS remote control from phone B.

## Call forwarding: how it works

A third-party app cannot pass the audio of a cellular (SIM) call from one phone to another. Android keeps call audio for system apps (`CAPTURE_AUDIO_OUTPUT`), and iOS gives apps no access to cellular calls at all. So when you need to actually **answer** on phone B, Phone Link switches on the carrier network's own call forwarding:

| | Code sent to the carrier | Effect |
|---|---|---|
| **Link** (recommended mode) | `*004*<other number>**20#` | Phone A rings for 20 s. Then the call goes to phone B. Calls also go to B when A is busy, switched off or has no signal. |
| Link, "only if unanswered" | `*61*<number>**20#` | For carriers that reject `*004*`. |
| Link, "all calls" | `*21*<number>#` | Phone A does not ring at all. |
| **Unlink** | `*004*<voicemail>**20#`, or `##004#` | Puts voicemail back (if you entered your voicemail number), or turns forwarding off. |
| Check | `*#61#` / `*#21#` | Your phone shows the real state the carrier holds. |

These are standard GSM codes (3GPP TS 22.030). The app sends them with `TelecomManager.placeCall`, which hands them to the telephony stack as network requests, not as calls.

## Three ways to switch the link

1. **In the app**: the big *Link / Unlink* button.
2. **Quick Settings tile**: swipe down, tap the pencil, and add **Phone Link**. Then it's one tap from anywhere.
3. **Remote control by SMS**, for when you left phone A at home and only have phone B. Install the app on both phones, enter each other's number and the same PIN, and turn on *Remote control* on both. On phone B, tap **Link it**. B sends `PHONELINK <pin> ON` to A. A turns on its chosen link method (alerts or forwarding) and replies `PHONELINK-ACK LINKED`, and B shows a notification.

Security of the remote control:
- A only accepts commands sent from the saved partner number **and** carrying the right PIN.
- A always forwards to the **saved** partner number, never to the sender. So a spoofed SMS can at most switch forwarding to *your own* other phone on or off. It can never send your calls to a stranger.

The app is symmetric: install it on both phones, and each one can forward to the other.

## Install

1. Open the repository's **Actions** tab, then the latest **Phone Link (Android)** run. Download the **phone-link-apk** artifact and unzip it.
2. Copy `app-debug.apk` to each phone and open it. Allow "install unknown apps" for your file manager or browser when Android asks.
3. Open Phone Link and allow what it asks for: **Phone**, **Contacts** and **Notifications**. For alerts, also allow **call detection**.
4. Only for SMS remote control: Android 13 and later block SMS permissions for apps installed outside the Play Store. Go to **Settings → Apps → Phone Link → ⋮ → Allow restricted settings**, then turn on remote control again.

To build it yourself, use Android Studio, or run `./gradlew assembleDebug` in this folder (needs JDK 17 and the Android SDK).

## First-time setup for forwarding (once, with both phones in hand)

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
│   ├── Ntfy.kt             alert message (JSON), topics, server URLs
│   ├── ForwardingCodes.kt  builds the GSM codes
│   ├── PhoneNumbers.kt     cleaning and matching numbers
│   └── RemoteCommand.kt    SMS protocol and PIN check
├── Link.kt               on/off for whichever method is selected
├── CallAlertService.kt   Android 10+: sees incoming calls (CallScreeningService)
├── LegacyCallReceiver.kt Android 8–9: same, through the phone-state broadcast
├── Alerts.kt             builds and sends the alert (ntfy, SMS fallback)
├── Forwarder.kt          sends the codes (TelecomManager.placeCall)
├── SmsReceiver.kt        remote control
├── LinkTileService.kt    Quick Settings tile
├── MainActivity.kt       settings and status screen
├── Prefs.kt, Sms.kt, Notifier.kt
```

There are no third-party dependencies, only the Android framework. `minSdk` is 26 (Android 8.0) and `targetSdk` is 35.
