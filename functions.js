import { handleClick, focusAndTypeInput, rl, page } from "./page.js";
import { PHONE_NUMBER, RELOCATION_TIMEOUT } from "./constants.js";
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

async function formSubmit() {
  const emailInputSelector = 'input[data-qa="account-signup-email"]';
  const submitButtonSelector = 'button[data-qa="account-signup-submit"]';
  await focusAndTypeInput(emailInputSelector, PHONE_NUMBER);
  await handleClick(submitButtonSelector);
}
async function handleRecaptcha() {
  const captchaInput = 'input[data-qa="account-captcha-input"]';
  const captchaText = await askUser("Write captcha?");

  await focusAndTypeInput(captchaInput, captchaText);
  await handleClick('button[data-qa="account-signup-submit"]');
}
async function checkRelocation(counterRelocationTimeOut) {
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
  } else if (counterRelocationTimeOut < RELOCATION_TIMEOUT) {
    counterRelocationTimeOut++;
    await checkRelocation();
  } else {
    counterRelocationTimeOut = 0;
  }
}
export { formSubmit, handleRecaptcha, askUser, checkRelocation };
