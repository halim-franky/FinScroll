# Screenshot capture checklist

The root `README.md` references six PNG files in this folder. Capture them and drop them in.

| File | What to capture | Frame / state |
|---|---|---|
| `landing.png` | The landing page hero | `/` — show the "Stop Doomscrolling. Start Wealth-Building." headline with the live scroll-cost counter visible |
| `feed.png` | A Learn card mid-scroll | `/feed` — Story 5-frame card showing the YouTube embed (frame 1 of 5) with the topic chip + wealth ticker visible |
| `coach.png` | AI Coach mid-conversation | `/chat` — one user message + one AI response with the source-pill citations visible |
| `receipt.png` | The Receipt of Attention share view | Complete one card → reach the Proof frame → tap Share. Capture the thermal-paper-styled receipt with the personalized +$X future wealth value |
| `stats.png` | Stats / streak page | `/stats` — show streak hero, concepts-mastered, weekly log. If empty, sign in first and complete 1-2 quizzes |
| `account.png` | Account screen | `/account` — show the Profile / Security rows and the legal footer links |

## How to capture (Chrome DevTools, mobile preset)

For consistency with the design (mobile-first 390px viewport):

1. Open the page in Chrome
2. DevTools (⌘+Option+I) → Toggle device toolbar (⌘+Shift+M)
3. Set device to **iPhone 14 Pro** or any 390-420px-wide preset
4. Cursor over the page area → ⋮ menu (top right of device toolbar) → **Capture screenshot**
5. Chrome downloads a PNG of just the device viewport — perfect aspect ratio

Drop the file in this folder with the exact filename from the table above. No resizing or cropping needed.

## Tips for portfolio-grade shots

- **Empty states are bad** — sign up, complete onboarding, master 2-3 cards before capturing `stats.png`. A streak of 0 looks unfinished.
- **Dark mode is the design** — don't switch to light. The app doesn't have a light theme by design.
- **Avoid personal info** — use a throwaway email for the account screen, blur or crop your own email out of any shared URLs.
- **Captured at 2x DPR** by default on Retina, which is what you want for crisp portfolio display.

## Optional GIFs

A 5-10 second GIF of the feed scrolling + a card transitioning through its 5 frames would be much more compelling than a static image. To capture:

- Use Chrome DevTools → Record (3-dot menu → More tools → Recorder) or any third-party tool (Kap, LICEcap, CleanShot X)
- Export as `feed.gif` and reference it in the README the same way as a PNG (markdown image syntax handles both)
- Keep under 5 MB so GitHub doesn't compress it
