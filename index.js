"use strict";

import puppeteer from "puppeteer";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const phoneNumber = "87777472747";
const searchTextVacancy = "vue";
const baseUrl = "https://almaty.hh.kz";

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

    await inputPhone?.evaluate((inputPhone) => {
      inputPhone.focus();
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

            await inputRecaptcha.evaluate((inputRecaptcha) => {
              inputRecaptcha.focus();
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
      `${baseUrl}/search/vacancy?text=${searchTextVacancy}&salary=&ored_clusters=true&search_field=name&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line`
    );
    await getButtons();
  }

  async function getButtons() {
    setTimeout(async () => {
      const responseButtons = await page.$$(
        'a[data-qa="vacancy-serp__vacancy_response"]'
      );

      const buttonUrls = [];

      for await (const responseButton of responseButtons) {
        buttonUrls.push(
          await responseButton?.evaluate((responseButton) => {
            setTimeout(() => {
              responseButton.click();
            }, 4000);
            return responseButton.href;
          })
        );

        await checkRelocation();

        console.log(page.url(), "page.url()");

        if (page.url()?.includes("vacancy_response")) {
          console.log("route back");
          await routeBack();
        }
      }

      console.log(buttonUrls);

      await pagination();
    }, 4000);
  }

  async function checkRelocation() {
    setTimeout(async () => {
      const relocationButton = await page.$(
        'button[data-qa="relocation-warning-confirm"]'
      );

      if (relocationButton)
        await relocationButton?.evaluate((relocationButton) => {
          relocationButton?.click();
        });
      else return;
    }, 2000);
  }

  async function routeBack() {
    await page.goto(
      `${baseUrl}/search/vacancy?text=${searchTextVacancy}&salary=&ored_clusters=true&search_field=name&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line&page=${pageCount}`
    );
    setTimeout(async () => {
      await getButtons();
    }, 2000);
  }

  async function pagination() {
    setTimeout(async () => {
      pageCount++;
      await page.goto(
        `${baseUrl}/search/vacancy?text=${searchTextVacancy}&salary=&ored_clusters=true&search_field=name&hhtmFrom=vacancy_search_list&hhtmFromLabel=vacancy_search_line&page=${pageCount}`
      );
    }, 5000);

    await getButtons();
  }

  async function loginOtp() {
    setTimeout(async () => {
      const inputOtpCode = await page.$('input[data-qa="otp-code-input"]');

      await inputOtpCode.evaluate((inputOtpCode) => {
        inputOtpCode.focus();
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
