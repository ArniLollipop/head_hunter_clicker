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
let pageCount = 0;

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
          }, 2000);
        });
      }
    }, 2000);
  }

  async function search() {
    const inputSearch = await page.$('input[data-qa="search-input"]');

    await inputSearch.evaluate((inputSearch) => {
      inputSearch.focus();
    });

    await page.keyboard.type(searchTextVacancy);

    await page.click('button[data-qa="search-button"]');

    setTimeout(async () => {
      await getButtons();
    }, 2000);
  }

  async function getButtons() {
    setTimeout(async () => {
      const responseButtons = await page.$$(
        'a[data-qa="vacancy-serp__vacancy_response"]'
      );

      const urlsArr = [];

      for await (const responseButton of responseButtons) {
        urlsArr.push(
          await responseButton?.evaluate(async (responseButton) => {
            responseButton.click();
            return responseButton.href || "";
          })
        );

        await checkRelocation();

        if (page.url()?.includes("vacancy_response")) {
          await routeBack();
        }
        await pagination();
      }

      console.log(urlsArr);
    }, 2000);
  }

  async function checkRelocation() {
    setTimeout(async () => {
      const relocationButton = await page.$(
        'button[data-qa="relocation-warning-confirm"]'
      );

      await relocationButton?.evaluate((relocationButton) => {
        relocationButton?.click();
      });
    }, 2000);
  }

  async function routeBack() {
    console.log("in response page");
    await page.goto(
      `${baseUrl}/search/vacancy?schedule=remote&search_field=name&search_field=company_name&search_field=description&text=${searchTextVacancy}&enable_snippets=false&page=${pageCount}`
    );
    setTimeout(async () => {
      await getButtons();
    }, 2000);
  }

  async function pagination() {
    setTimeout(async () => {
      pageCount++;
      console.log(urlsArr);
      await page.goto(
        `${baseUrl}/search/vacancy?schedule=remote&search_field=name&search_field=company_name&search_field=description&text=${searchTextVacancy}&enable_snippets=false&page=${pageCount}`
      );
      setTimeout(async () => {
        await getButtons();
      }, 2000);
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
        }, 2000);
      });
    }, 2000);
  }
})();
