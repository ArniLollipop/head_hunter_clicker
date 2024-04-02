import puppeteer from "puppeteer";
import readline from "readline";
import {
  VACANCY,
  TIMEOUT,
  BASE_URL,
  PHONE_NUMBER,
  RELOCATION_TIMEOUT,
  DEV_MODE,
} from "./constants.js";

let pageCount = 0;

(async () => {
  const browser = await puppeteer.launch({
    headless: DEV_MODE,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const page = await browser.newPage();
  let counterRelocationTimeOut = 0;
  await page.setViewport({
    width: 1920 + Math.floor(Math.random() * 100),
    height: 3000 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });
  // await page.setUserAgent(
  //   "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
  // );

  try {
    await login();
    rl.close();
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }

  async function login() {
    await page.goto(`${BASE_URL}/account/login`);
    await formSubmit();
    await checkRecaptcha();
  }

  async function formSubmit() {
    const emailInputSelector = 'input[data-qa="account-signup-email"]';
    const submitButtonSelector = 'button[data-qa="account-signup-submit"]';
    await focusAndTypeInput(emailInputSelector, PHONE_NUMBER);
    await handleClick(submitButtonSelector);
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
  /**
   * @Eg0r0k
   * @async
   * @param {string} question - Question for user
   * @returns {Promise<string>}
   */

  async function askUser(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }
  async function handleRecaptcha() {
    const captchaInput = 'input[data-qa="account-captcha-input"]';
    const captchaText = await askUser("Write captcha?");

    await focusAndTypeInput(captchaInput, captchaText);
    await handleClick('button[data-qa="account-signup-submit"]');
  }
  async function checkRecaptcha() {
    const captchaImageSelector = ".hhcaptcha-module_hhcaptcha-picture__-7tAb";
    const captchaImage = await page.$(captchaImageSelector);

    const src = await captchaImage.evaluate(async (img) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return img.src;
    });
    if (src && src.includes("picture")) {
      await handleRecaptcha();
    }
    await loginOtp();
    setTimeout(async () => {
      await search();
    }, 2000);
  }
  async function getButtons() {
    const responseButtons = await page.$$(
      'a[data-qa="vacancy-serp__vacancy_response"]'
    );

    const buttonUrls = [];

    for await (const responseButton of responseButtons) {
      buttonUrls.push(
        await responseButton?.evaluate(async (responseButton) => {
          await responseButton.click();
          return responseButton.href;
        })
      );

      await checkRelocation();

      if (page.url()?.includes("vacancy_response")) {
        console.log("route back");
        await routeBack();
      }
    }

    await pagination();
  }
  async function checkRelocation() {
    const relocationButton = await page.$(
      'button[data-qa="relocation-warning-confirm"]'
    );
    if (relocationButton) {
      console.log(
        await relocationButton?.evaluate(async (relocationButton) => {
          await relocationButton?.click();
          return relocationButton.innerHTML;
        })
      );
    } else {
      if (counterRelocationTimeOut < RELOCATION_TIMEOUT) {
        counterRelocationTimeOut++;
        await checkRelocation();
      } else {
        counterRelocationTimeOut = 0;
      }
    }
  }

  async function routeBack() {
    await page.goto(
      `${BASE_URL}/search/vacancy?text=${VACANCY}&ored_clusters=true&resume=d9215d98ff056f58fd0039ed1f6f5a55785962&schedule=remote&search_period=7&forceFiltersSaving=true&page=${pageCount}`
    );
    await getButtons();
  }

  async function pagination() {
    pageCount++;
    await page.goto(
      `${BASE_URL}/search/vacancy?text=${VACANCY}&ored_clusters=true&resume=d9215d98ff056f58fd0039ed1f6f5a55785962&schedule=remote&search_period=7&forceFiltersSaving=true&=page${pageCount}`
    );

    await getButtons();
  }

  async function search() {
    await page.goto("https://hh.ru", { waitUntil: "domcontentloaded" });
    await getButtons();
  }

  async function loginOtp() {
    const optCode = await askUser("Write optCode?");
    await focusAndTypeInput('input[data-qa="otp-code-input"]', optCode);
    await handleClick('button[data-qa="otp-code-submit"]');
    await page.waitForNavigation();
    await search();
  }
})();
