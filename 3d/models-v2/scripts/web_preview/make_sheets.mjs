import puppeteer from "puppeteer-core"; import fs from "fs"; import path from "path";
const [outDir, ...models] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new", args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-webgl"] });
const page = await browser.newPage();
for (const m of models) {
  await page.goto(`http://localhost:8765/models-v2/scripts/web_preview/sprite.html?model=${encodeURIComponent("/" + m)}&cols=24&cell=240&pitches=10,30,50`, { waitUntil: "load" });
  await page.waitForFunction("window.__done === true", { timeout: 180000 });
  const err = await page.evaluate(() => window.__error);
  if (err) { console.log("ERR", m, err); continue; }
  const url = await page.evaluate(() => window.__sheet);
  fs.writeFileSync(path.join(outDir, path.basename(m, ".glb") + ".png"), Buffer.from(url.split(",")[1], "base64"));
  console.log("sheet", path.basename(m));
}
await browser.close();
