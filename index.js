import { page, search, focusAndTypeInput, handleClick, rl } from "./page.js";
import { VACANCY, BASE_URL } from "./constants.js";
import {
  formSubmit,
  handleRecaptcha,
  askUser,
  checkRelocation,
} from "./functions.js";
(async () => {
  let counterRelocationTimeOut = 0;
  try {
    await login();
    rl.close();
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    await browser.close();
  }

  async function login() {
    await page.goto(`${BASE_URL}/account/login`, { waitUntil: "networkidle2" });
    await formSubmit();
    await checkRecaptcha();
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

      await checkRelocation(counterRelocationTimeOut);

      if (page.url()?.includes("vacancy_response")) {
        console.log("route back");
        await routeBack();
      }
    }

    await pagination();
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
  async function loginOtp() {
    const optCode = await askUser("Write optCode?");
    await focusAndTypeInput('input[data-qa="otp-code-input"]', optCode);
    await handleClick('button[data-qa="otp-code-submit"]');
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    await search();
  }
})();
