This is the head hunter clicker to offers.

Used Library puppeteer(https://www.npmjs.com/package/puppeteer) for parsing and readline for write some info to the console

const phoneNumber = "87777472747";
// set your phone and after submit you will get Sms Code

const searchTextVacancy = "vue";
// set your vacancy text which you need

const baseUrl = "https://almaty.hh.kz";

// now used this url ${baseUrl}/search/vacancy?schedule=remote&search_field=name&search_field=company_name&search_field=description&text=${searchTextVacancy}&enable_snippets=false&page=${pageCount}

To start the Project

npm install

npm start

it will open new browser tab and ask you in console recaptcha-picture's text which will be open in browser, write it in console and press enter
after console ask you sms-code, also write it and press enter

---

it will skip vacancies where you need to answer survey like

What was your experience?
What technology you use?
and etc.

---

Maybe in the future i will do it, but now that's enough
