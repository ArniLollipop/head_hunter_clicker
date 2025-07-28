import puppeteer from "puppeteer";
import readline from "readline";
import {
  VACANCY,
  TIMEOUT,
  BASE_URL,
  PHONE_NUMBER,
  DEV_MODE,
} from "./constants.js";

let pageCount = 1;

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
    const buttonLoginAsWorkerSelector = 'button[data-qa="submit-button"]';
    await handleClick(buttonLoginAsWorkerSelector);
    await formSubmit();
    await checkRecaptcha();
  }

  async function formSubmit() {
    const phoneInputSelector =
      'input[data-qa="magritte-phone-input-national-number-input"]';
    const submitButtonSelector = 'button[data-qa="submit-button"]';
    await focusAndTypeInput(phoneInputSelector, PHONE_NUMBER);
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
    await handleClick('button[data-qa="submit-button"]');
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

    console.log("responseButtons");
    let buttonUrls = [];
    let skippedButtons = [];

    for await (const responseButton of responseButtons) {
      const url = await responseButton?.evaluate(async (responseButton) => {
        await responseButton.click();
        return responseButton.href;
      });
      console.log("url", url);

      if (!skippedButtons.includes(url)) {
        buttonUrls.push(url);
      } else {
        continue;
      }

      console.log("before checkRelocation");
      await checkRelocation();
      console.log("after checkRelocation");

      console.log("before checkOverlayModal");
      await checkOverlayModal();
      console.log("after checkOverlayModal");

      if (page.url()?.includes("vacancy_response")) {
        skippedButtons.push(url);
        console.log("before routeBack");
        await routeBack();
        console.log("after routeBack");
      }
    }

    console.log("pagination");
    await pagination();
  }

  async function checkRelocation() {
    await new Promise((resolve) => setTimeout(resolve, TIMEOUT));

    const relocationModal = await page.$('div[data-qa="magritte-alert"]');

    if (relocationModal) {
      console.log("relocationModal found");
      const relocationButton = 'button[data-qa="relocation-warning-confirm"]';
      const element = await page.$(relocationButton);
      await element.click();
      console.log("relocationButton clicked");
    }

    return;
  }

  async function checkOverlayModal() {
    await new Promise((resolve) => setTimeout(resolve, TIMEOUT));
    const overlayModal = await page.$('div[data-qa="modal-overlay"]');
    if (overlayModal) {
      const closeButtonClass =
        "magritte-view___TfcUt_12-1-0 magritte-shadow-level-0___ko9ze_12-1-0";
      await handleClick(closeButtonClass);

      const targetText = "Не надо";
      const span = await page.$eval(`span:has-text("${targetText}")`);

      if (span) {
        await handleClick(`span:has-text("${targetText}")`);
      }
    }
  }

  async function routeBack() {
    await page.goto(
      `${BASE_URL}/search/vacancy?hhtmFrom=main&hhtmFromLabel=vacancy_search_line&enable_snippets=false&L_save_area=true&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=${VACANCY}&page=${pageCount}`,
      { waitUntil: "domcontentloaded" }
    );
    await getButtons();
  }

  async function pagination() {
    pageCount++;
    await page.goto(
      `${BASE_URL}/search/vacancy?hhtmFrom=main&hhtmFromLabel=vacancy_search_line&enable_snippets=false&L_save_area=true&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=${VACANCY}&page=${pageCount}`,
      { waitUntil: "domcontentloaded" }
    );

    await getButtons();
  }

  async function search() {
    await page.goto(
      `${BASE_URL}/search/vacancy?hhtmFrom=main&hhtmFromLabel=vacancy_search_line&enable_snippets=false&L_save_area=true&search_field=name&search_field=company_name&search_field=description&work_format=REMOTE&text=${VACANCY}&page=${pageCount}`,
      { waitUntil: "domcontentloaded" }
    );
    await getButtons();
  }

  async function loginOtp() {
    const optCode = await askUser("Write optCode?");
    await focusAndTypeInput(
      'input[data-qa="applicant-login-input-otp"]',
      optCode
    );
    await page.waitForNavigation();
    await search();
  }
})();
