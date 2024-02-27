"use strict";

import puppeteer from "puppeteer";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const phoneNumber = "87777472747";
const searchTextVacancy = "vue";
const baseUrl = "https://hh.kz";

// schedule = remote;
let pageCount = 0;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox",
      "--no-first-run",
      "--no-sandbox",
      "--no-zygote",
      "--deterministic-fetch",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
      // '--single-process',
    ],
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

  await page.goto(`${baseUrl}/account/login`);

  await formSubmit();

  await checkRecaptcha();

  async function formSubmit() {
    const inputPhone = await page.$('input[data-qa="account-signup-email"]');

    await inputPhone?.evaluate(async (inputPhone) => {
      await inputPhone.focus();
    });
    console.log("focused");

    await page?.keyboard.type(phoneNumber);
    console.log("typed");

    const text = await inputPhone?.evaluate((inputPhone) => {
      return inputPhone.value || "nothing";
    });
    console.log("inputValue", text);

    await page.click('button[data-qa="account-signup-submit"]');
    console.log("clicked");
  }

  async function checkRecaptcha() {
    setTimeout(async () => {
      const image = await page.$(".hhcaptcha-module_hhcaptcha-picture__-7tAb");

      const imageSrc = await image.evaluate((image) => {
        return image.src;
      });
      console.log(imageSrc);

      if (imageSrc.includes("login")) {
        await loginOtp();
      } else {
        rl.question("Write recaptcha? ", async function (answer) {
          const recaptcha = answer;

          setTimeout(async () => {
            const inputRecaptcha = await page.$(
              'input[data-qa="account-captcha-input"]'
            );

            await inputRecaptcha.evaluate(async (inputRecaptcha) => {
              await inputRecaptcha.focus();
            });

            await page.keyboard.type(recaptcha);

            const recaptchaText = await inputRecaptcha.evaluate(
              (inputRecaptcha) => {
                inputRecaptcha.value;
              }
            );

            await page.click('button[data-qa="account-signup-submit"]');

            await loginOtp();
          }, 2000);
        });
      }
    }, 2000);
  }

  async function search() {
    await page.goto(
      "/search/vacancy?ored_clusters=true&resume=d9215d98ff056f58fd0039ed1f6f5a55785962&schedule=remote&search_period=7&forceFiltersSaving=true"
    );
    await getButtons();
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

      console.log(page.url(), "page.url()");
      await checkRelocation();

      if (page.url()?.includes("vacancy_response")) {
        console.log("route back");
        await routeBack();
      }
    }

    console.log(buttonUrls);
    await pagination();
  }
  let counterRelocationTimeOut = 0;
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
      if (counterRelocationTimeOut < 100) {
        counterRelocationTimeOut++;
        await checkRelocation();
      } else {
        counterRelocationTimeOut = 0;
      }
    }
  }

  async function routeBack() {
    await page.goto(
      "https://hh.kz/search/vacancy?ored_clusters=true&resume=d9215d98ff056f58fd0039ed1f6f5a55785962&schedule=remote&search_period=7&forceFiltersSaving=true&page=" +
        pageCount
    );
    await getButtons();
  }

  async function pagination() {
    pageCount++;
    await page.goto(
      "https://hh.kz/search/vacancy?ored_clusters=true&resume=d9215d98ff056f58fd0039ed1f6f5a55785962&schedule=remote&search_period=7&forceFiltersSaving=true&=page" +
        pageCount
    );

    await getButtons();
  }

  async function loginOtp() {
    setTimeout(async () => {
      const inputOtpCode = await page.$('input[data-qa="otp-code-input"]');

      await inputOtpCode.evaluate(async (inputOtpCode) => {
        await inputOtpCode.focus();
      });

      rl.question("Write OtpCode? ", async function (answer) {
        const otpCode = answer;
        rl.close();

        await page.keyboard.type(otpCode);

        await page.click('button[data-qa="otp-code-submit"]');

        setTimeout(async () => {
          await search();
        }, 2000);
      });
    }, 2000);
  }
})();
