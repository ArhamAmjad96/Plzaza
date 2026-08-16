const axios = require("axios");
const cheerio = require("cheerio");
const { CookieJar } = require("tough-cookie");
const { wrapper } = require("axios-cookiejar-support");
const fs = require("fs");

const REFERENCE_NUMBER = "15142165162900";

async function fetchBill() {
  const jar = new CookieJar();

  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",
      },
    })
  );

  console.log("1. Opening IESCO bill search page...");

  const searchPage = await client.get(
    "https://bill.pitc.com.pk/iescobill"
  );

  console.log("   Status:", searchPage.status);

  const $ = cheerio.load(searchPage.data);

  const form = $("form#SubmitForm");

  if (!form.length) {
    throw new Error("Could not find the IESCO search form.");
  }

  console.log("2. Reading hidden form fields...");

  const formData = {};

  $("form#SubmitForm")
    .find("input[type='hidden'][name]")
    .each((_, element) => {
      const name = $(element).attr("name");
      const value = $(element).attr("value") || "";
      formData[name] = value;
    });

  console.log(
    "   Hidden fields found:",
    Object.keys(formData).join(", ")
  );

  console.log("3. Submitting reference number...");

  formData.rbSearchByList = "refno";
  formData.searchTextBox = REFERENCE_NUMBER;
  formData.ruCodeTextBox = "";
  formData.btnSearch = "Search";

  const billResponse = await client.post(
    "https://bill.pitc.com.pk/iescobill",
    new URLSearchParams(formData).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://bill.pitc.com.pk/iescobill",
      },
    }
  );

  console.log("   Final status:", billResponse.status);
  console.log("   Final URL:", billResponse.request?.res?.responseUrl || "unknown");

  fs.writeFileSync(
    "test-bill-result.html",
    billResponse.data,
    "utf8"
  );

  console.log("4. Saved response to test-bill-result.html");

  if (billResponse.data.includes(REFERENCE_NUMBER)) {
    console.log("SUCCESS: Reference number found in response!");
  } else {
    console.log("Reference number was NOT found in response.");
  }
}

fetchBill().catch((error) => {
  console.error("\nERROR:");
  console.error(error.message);
});