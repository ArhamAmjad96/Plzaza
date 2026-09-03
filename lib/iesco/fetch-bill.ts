import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import * as cheerio from "cheerio";

/**
 * Shared utility to fetch the raw IESCO/PITC bill HTML from bill.pitc.com.pk.
 * Handles sessions, cookies, hidden form fields, and validation.
 */
export async function fetchIescoBillHtml(referenceNumber: string): Promise<string> {
  const ref = referenceNumber.trim();
  if (!ref) {
    throw new Error("Reference number is required.");
  }

  // 1. Create cookie-aware HTTP client
  const jar = new CookieJar();
  const client = wrapper(
    axios.create({
      jar,
      withCredentials: true,
      maxRedirects: 5,
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
      },
    })
  );

  // 2. Open IESCO search page to retrieve hidden CSRF/session fields
  const searchPage = await client.get("https://bill.pitc.com.pk/iescobill");

  if (!searchPage.data || typeof searchPage.data !== "string") {
    throw new Error("Unable to access IESCO search page.");
  }

  const $ = cheerio.load(searchPage.data);
  const form = $("form#SubmitForm");

  if (!form.length) {
    throw new Error("Could not find the IESCO search form.");
  }

  const formData: Record<string, string> = {};

  $("form#SubmitForm")
    .find("input[type='hidden'][name]")
    .each((_, element) => {
      const name = $(element).attr("name");
      const value = $(element).attr("value") || "";
      if (name) {
        formData[name] = value;
      }
    });

  // 3. Add search parameters
  formData.rbSearchByList = "refno";
  formData.searchTextBox = ref;
  formData.ruCodeTextBox = "";
  formData.btnSearch = "Search";

  // 4. Submit form
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

  if (!billResponse.data || typeof billResponse.data !== "string") {
    throw new Error("IESCO returned an invalid response.");
  }

  // Check if reference number is in response or if PITC showed an error
  if (!billResponse.data.includes(ref)) {
    throw new Error("Bill was not found for this reference number.");
  }

  return billResponse.data;
}
