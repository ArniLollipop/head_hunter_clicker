"use strict";

import puppeteer from "puppeteer";
import readline from "readline";
import randomUseragent from "random-useragent";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const phoneNumber = "87777472747";
const searchTextVacancy = "vue";
let pageCount = 0;
let count = 0;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36";

const userAgent = randomUseragent.getRandom();

const UA = userAgent || USER_AGENT;

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
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

  page.setDefaultNavigationTimeout(0);

  await page.goto("https://almaty.hh.kz/account/login");

  const inputPhone = await page.$('input[data-qa="account-signup-email"]');
  const button = await page.$('button[data-qa="account-signup-submit"]');

  await inputPhone.evaluate((inputPhone) => {
    inputPhone.focus();
  });
  console.log("focused");

  await page.keyboard.type(phoneNumber);
  console.log("typed");

  const text = await inputPhone.evaluate((inputPhone) => {
    return inputPhone.value || "nothing";
  });
  console.log("inputValue", text);

  await page.click('button[data-qa="account-signup-submit"]');
  console.log("clicked");

  setTimeout(async () => {
    const image = await page.$(".hhcaptcha-module_hhcaptcha-picture__-7tAb");

    const language = await page.$('button[data-qa="captcha-language"]');

    const languageText = await language.evaluate((language) => {
      return language.innerHTML || "nothing";
    });

    console.log(languageText);

    const imageSrc = await image.evaluate((image) => {
      return image.src;
    });
    console.log(imageSrc, "imageSrc");

    if (imageSrc.includes("login")) {
      await loginOtp();
    } else {
      rl.question("Write recaptcha? ", async function (answer) {
        console.log(`text is ${answer}`);
        const recaptcha = answer;

        setTimeout(async () => {
          const inputRecaptcha = await page.$(
            'input[data-qa="account-captcha-input"]'
          );

          await inputRecaptcha.evaluate((inputRecaptcha) => {
            inputRecaptcha.focus();
          });

          await page.keyboard.type(recaptcha);

          const recaptchaText = await inputRecaptcha.evaluate(
            (inputRecaptcha) => {
              inputRecaptcha.value;
            }
          );

          console.log(recaptchaText, "recaptchaText");

          await page.click('button[data-qa="account-signup-submit"]');

          await loginOtp();
        }, 5000);
      });
    }
  }, 5000);

  async function search() {
    const inputSearch = await page.$('input[data-qa="search-input"]');

    await inputSearch.evaluate((inputSearch) => {
      inputSearch.focus();
    });

    await page.keyboard.type(searchTextVacancy);

    await page.click('button[data-qa="search-button"]');

    setTimeout(async () => {
      await getButtons();
    }, 5000);
  }

  async function getButtons() {
    setTimeout(async () => {
      const responseButtons = await page.$$(
        'a[data-qa="vacancy-serp__vacancy_response"]'
      );

      console.log(page.url(), "before click");

      await responseButtons[count]?.evaluate(async (responseButton) => {
        responseButton.click();
      });

      if (responseButtons[count] == undefined) {
        setTimeout(async () => {
          console.log(page.url(), "after click");
          count = 0;
          await getButtons();
        }, 4000);
      }
      if (page.url()?.includes("response")) {
        await page.goto(
          `https://almaty.hh.kz/search/vacancy?text=${searchTextVacancy}`
        );
        setTimeout(async () => {
          count = 0;
          await getButtons();
        }, 4000);
      }
      console.log(responseButtons.length, count, "after click");
      if (responseButtons.length < count) {
        pageCount++;
        await page.goto(
          `https://almaty.hh.kz/search/vacancy?text=${searchTextVacancy}&page=${pageCount}`
        );
      }

      const relocationButton = await page.$(
        'button[data-qa="relocation-warning-abort"]'
      );

      if (relocationButton) {
        await relocationButton?.evaluate((relocationButton) => {
          relocationButton?.click();
        });
      }

      setTimeout(async () => {
        console.log(page.url(), "after click");
        count++;
        await getButtons();
      }, 4000);
    }, 2000);
  }

  async function loginOtp() {
    setTimeout(async () => {
      const inputOtpCode = await page.$('input[data-qa="otp-code-input"]');

      await inputOtpCode.evaluate((inputOtpCode) => {
        inputOtpCode.focus();
      });

      rl.question("Write OtpCode? ", async function (answer) {
        console.log(`OtpCode is ${answer}`);
        const otpCode = answer;
        rl.close();

        await page.keyboard.type(otpCode);

        await page.click('button[data-qa="otp-code-submit"]');

        setTimeout(async () => {
          await search();
        }, 5000);
      });
    }, 5000);
  }
})();
