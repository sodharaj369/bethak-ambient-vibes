# Bethak: A Digital Baithak

Lovable prompt — BETHAK.WTF

Build a minimalist, immersive music website called BETHAK.

The concept is a digital Indian baithak/bethak — a quiet, intimate late-night sitting room where people sit, drink chai and listen to ghazals and old Hindi music.

I want the website to feel like a tiny place on the internet, not like a normal music streaming application.

IMPORTANT DESIGN DIRECTION

I have provided a custom illustration of the Bethak room.

Use that illustration as the primary full-screen background. Do NOT generate or replace the illustration.

The illustration shows:

 traditional Indian wooden diwan

 cushions

 chai on a low table

 harmonium

 warm table lamp

 ceiling fan

 open window with moonlit night

 old family photograph

 books/newspaper

 warm nostalgic Indian home atmosphere

The illustration should occupy the entire viewport.

Do NOT put the image inside a card.

Do NOT add borders around it.

Do NOT create a conventional website header.

The experience should feel similar in simplicity to a small experimental internet website such as Saloon.WTF: full-screen artwork + small UI + music player.

1. PAGE STRUCTURE

Create a single-page website.

There should be essentially only one screen.

Background

Use the provided Bethak illustration as:

background-image: cover

It must always cover the viewport.

On desktop:

 preserve the full composition as much as possible

 use background-size: cover

 center the image

On mobile:

 use a dedicated mobile crop if I provide one later

 for now intelligently position the background so the important room elements remain visible

Add a very subtle dark overlay, approximately 5–12%, only if necessary to improve text readability.

Do not make the image noticeably darker.

2. TITLE

Place the Hindi title:

बैठक

This MUST be real HTML/SVG text, not generated inside the background image.

Use a beautiful Devanagari display font.

The title should be:

 white

 large

 elegant

 slightly artistic

 centered horizontally

 positioned around the upper-middle area

 visually integrated with the illustration

Do not use a generic modern sans-serif font.

Find an appropriate Devanagari font from Google Fonts if available, preferably something elegant and traditional.

The title should simply say:

बैठक

No subtitle underneath initially.

3. TOP LEFT

Show the current local time.

Example:

11:47 PM

Requirements:

 automatically update every minute

 use 12-hour format

 white text

 small

 subtle

 no date

 no seconds

Position:

approximately 24px from the left and 24px from the top on desktop.

On mobile:

approximately 16px from the edges.

4. TOP CENTER / ONLINE USERS

Add a tiny status indicator similar to:

🟢 27 online

But don't make it look like a social network.

It should be subtle.

Use:

 tiny green circle

 random number between approximately 15–60

 white/cream text

The number can change occasionally to simulate people currently sitting in the Bethak.

For example:

🟢 34 online

Do NOT build actual accounts or real-time user tracking.

This is only an atmospheric detail.

5. TOP RIGHT

Add two very subtle external music links:

Spotify ↗

YouTube Music ↗

These should appear in white.

They should be small and unobtrusive.

For now, use placeholder URLs/constants that are easy for me to replace later.

Do NOT open Spotify or YouTube inside an iframe unless explicitly required.

Clicking them should open the relevant playlist in a new tab.

Keep this area extremely minimal.

6. MUSIC PLAYER

This is the most important UI element.

Create a floating pill-shaped music player at the bottom center, inspired by the general simplicity of Saloon.WTF but with its own visual identity.

Do NOT copy the Saloon player exactly.

The player should feel like it belongs to this Bethak room.

Position

Desktop:

 fixed

 bottom: approximately 28px

 centered horizontally

 width: approximately 620–680px

 height: approximately 90–110px

Mobile:

 fixed

 bottom: approximately 16px

 width: calc(100% - 24px)

 height: approximately 85–95px

7. PLAYER DESIGN

Use:

 translucent dark warm-brown background

 approximately 75–85% opacity

 subtle backdrop blur

 very soft shadow

 large border radius

 no obvious border

 elegant minimal appearance

Do NOT use Spotify's default embedded player design.

The player should look custom.

Player contents

Left:

Album artwork

Approximately 64x64 desktop.

Rounded circle or very subtle rounded square.

Center:

Song title

Example:

Hothon Se Chhu Lo Tum

Below it:

Jagjit Singh

Below that:

thin progress bar

Right:

Previous
Play/Pause
Next

Use simple elegant icons.

8. INITIAL PLAYLIST DATA

For the first version, create a local JavaScript playlist object.

Do NOT require Spotify API authentication for the initial UI.

Example structure:

const bethakPlaylist = [
  {
    title: "Hothon Se Chhu Lo Tum",
    artist: "Jagjit Singh",
    artwork: "/music/hothon.jpg",
    spotifyUrl: "",
    youtubeUrl: ""
  },
  {
    title: "Tum Ko Dekha To Yeh Khayal Aaya",
    artist: "Jagjit Singh",
    artwork: "/music/tumko.jpg",
    spotifyUrl: "",
    youtubeUrl: ""
  }
];

Use placeholder artwork if actual artwork is not available.

Make the playlist architecture easy to replace later.

9. IMPORTANT MUSIC IMPLEMENTATION

For the first version, do not download or host copyrighted Bollywood/Ghazal MP3 files.

Build the player UI and playlist architecture first.

The music playback layer should be abstracted so that I can later connect it to an authorized provider such as Spotify or YouTube.

Create a clean interface/service such as:

MusicProvider
 ├── play()
 ├── pause()
 ├── next()
 ├── previous()
 ├── seek()
 └── getCurrentTrack()

For now, use a mock/demo playback state if actual streaming credentials are unavailable.

Do not make the whole website dependent on an API key.

10. PLAY / PAUSE BEHAVIOR

When the user clicks Play:

 change icon to Pause

 animate the progress bar

 update elapsed time

 show current track

When Pause:

 stop progress

 retain current position

Next:

 move to next track

Previous:

 previous track

If the song has been playing for more than approximately 3 seconds, Previous should restart the current song; otherwise go to the previous track.

Shuffle is NOT required.

Volume control is NOT required initially.

11. MOBILE EXPERIENCE

This is extremely important.

The site should feel like a mobile-first experience, because people will discover it through WhatsApp/Instagram/Reddit links.

On a 390x844 phone:

The entire room should still feel beautiful.

Keep:

 time at top left

 online indicator near top

 music links top right

 large "बैठक"

 background illustration

 player at bottom

Avoid scrolling.

The page should be:

100dvh
overflow: hidden

There should be no visible scrollbar.

The music player must remain accessible without covering the most important part of the illustration.

12. RESPONSIVENESS

Desktop:

Full-screen illustration
        ↓
   बैठक
        ↓
 small top UI
        ↓
 floating player

Mobile:

      time

    बैठक


   room / window
   / harmonium

 floating player

Use responsive CSS rather than creating a completely different application.

13. ANIMATION

Keep animations extremely subtle.

Allowed:

 slow background breathing/ambient movement if practical

 tiny lamp glow

 very subtle curtain movement

 very subtle ceiling fan movement

 player progress animation

 fade transitions when song changes

Do NOT animate the entire illustration.

Do NOT add particles.

Do NOT add flashy gradients.

Do NOT add excessive hover effects.

The website should feel calm.

14. ATMOSPHERE

The emotional target is:

11:30 PM in an old Indian home.

Someone has made chai.

Someone is sitting on the diwan.

A ghazal is playing.

The rest of the house is quiet.

The visitor should feel:

 warm

 nostalgic

 peaceful

 slightly melancholic

 intimate

Avoid making it:

 luxurious

 royal

 palace-like

 overly traditional

 overly colorful

 religious

 kitschy

 modern SaaS-like

15. TYPOGRAPHY

Primary title:

बैठक

Use an elegant Devanagari font.

UI text:

Use a clean modern font such as Inter or a similar highly readable font.

The contrast between the traditional Hindi title and modern tiny UI is intentional.

16. NO NORMAL WEBSITE FEATURES

Do NOT add:

 navbar

 About section

 footer

 login

 signup

 user profiles

 comments

 search

 recommendation engine

 playlist creation

 dashboard

 cards

 pricing

 analytics UI

 social feed

 chat

 unnecessary buttons

This is intentionally a one-screen experimental website.

17. DESKTOP BEHAVIOR

The browser viewport should be completely filled.

No scrolling.

No white margins.

No body background visible around the illustration.

The website should look like a fullscreen digital artwork.

18. ACCESSIBILITY

Add:

 proper button labels

 keyboard accessibility for player controls

 sufficient contrast

 alt text for meaningful imagery

But don't let accessibility features visually clutter the experience.

19. CODE QUALITY

Use a simple maintainable structure.

Suggested:

src/
  components/
    BethakBackground
    BethakTitle
    TopBar
    MusicPlayer
  data/
    playlist.js
  services/
    musicProvider.js
  App.jsx

Keep the implementation simple.

Do not introduce unnecessary dependencies.

20. MOST IMPORTANT CREATIVE RULE

Do not turn BETHAK into a music streaming application.

It is an atmospheric internet experience.

The illustration is the room.

The music is what makes the room alive.

The UI should almost disappear.

When someone opens it, their first reaction should be:

“Oh… this is beautiful.”

Then the song starts and the reaction should be:

“This song belongs here.”

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://bethak-ambient-vibes.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6701c47f-b796-4d87-b4ab-aa45a2a7709d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
