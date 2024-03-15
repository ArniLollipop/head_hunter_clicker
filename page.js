import puppeteer from "puppeteer";
import readline from "readline";
import { DEV_MODE, TIMEOUT } from "./constants.js";
const browser = await puppeteer.launch({
  headless: !DEV_MODE,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage();
await page.setViewport({
  width: 1920 + Math.floor(Math.random() * 100),
  height: 3000 + Math.floor(Math.random() * 100),
  deviceScaleFactor: 1,
  hasTouch: false,
  isLandscape: false,
  isMobile: false,
});
await page.setUserAgent(
  "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
);

async function search() {
  await page.goto("https://hh.ru", { waitUntil: "domcontentloaded" });
  await getButtons();
}
/**
 * @async
 * @param {string} selector - Selector for element
 * @param {string} text - Text for input
 */
async function focusAndTypeInput(selector, text) {
  const typeElement = await page.waitForSelector(selector, {
    visible: true,
    timeout: TIMEOUT,
  });
  await typeElement.focus();
  await page.keyboard.type(text);
}

/**
 * @async
 * @param {string} selector - Selector for element
 */
async function handleClick(selector) {
  await page.waitForSelector(selector);
  const element = await page.$(selector);
  await element.click();
}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
export { page, search, focusAndTypeInput, handleClick, rl };
