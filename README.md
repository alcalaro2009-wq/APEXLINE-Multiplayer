# APEXLINE – WebSocket multiplayer starter

This is the original game plus a working Node.js WebSocket server for **shared online rooms, visible remote player avatars, chat, and activity join announcements**. Existing singleplayer gameplay remains available.

## Run locally
1. Install Node.js 20 or later.
2. Open this folder in Terminal.
3. Run `npm install` and then `npm start`.
4. Open `http://localhost:3000` in your browser.
5. Open another tab or another computer on the same server URL, and enter the **same room code** in the top bar. You should see other characters moving and be able to chat.

## Put online with Render (no Replit or Cloudflare)
1. Upload this folder to a GitHub repository, with `package.json`, `server.js`, and the `public` folder all at the root.
2. In Render, create a **Web Service** from that repository (Node runtime).
3. Build command: `npm install`; start command: `npm start`.
4. Open your deployed HTTPS link with friends; use the same room code.
5. For continuous reliability, use a hosting tier that doesn't sleep. The server holds rooms in memory, so restarting it clears sessions.

## Limitations (important)
- Online connections, room isolation, position updates, other player visibility, chat and activity announcements are real.
- **Basketball, racing, paintball, progression, damage, scores, ball possession, physics, and matchmaking are NOT authoritative or synchronised between players.** Playing the same activity does not create a fair shared competitive match. Those require dedicated server-side activity state and input validation.
- Player coordinates are client-supplied and validated for type and range only; this is not cheat prevention.
- No database, login, persistence, matchmaking, or latency compensation yet. Do not deploy as a competitive production multiplayer game.
- If players don't appear, ensure the same room code, page is served through the Node server (not opened as a local HTML file), and check the browser developer console.

## Files
- `public/index.html`: original APEXLINE game with network integration.
- `public/network.js`: WebSocket transport and room controls.
- `server.js`: Express static server and WebSocket room relay.
- `package.json`: installation dependencies.
