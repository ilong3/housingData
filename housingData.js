import puppeteer from "puppeteer";
import { parse } from "json2csv";
import { writeFileSync } from "fs";
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    userDataDir: "./tmp",
  });

  const houseDataCollections = [];
  let currentPage = 1;
  const maxPages = 5;
  try {
    while (currentPage <= maxPages) {
      const page = await browser.newPage();
      const url = `https://nigeriapropertycentre.com/for-sale/houses/showtype?page=${currentPage}`;
      await page.goto(url, { waitUntil: "networkidle2" });

      const allProducts = await page.$$(
        `.col-md-8 .col-md-12 .wp-block.property.list`
      );

      for (const prod of allProducts) {
        const title = await page.evaluate((prod) => {
          return prod.querySelector(`.wp-block-content h4`).textContent.trim();
        }, prod);

        const price = await page.evaluate((prod) => {
          return prod
            .querySelector(`.wp-block-content span.pull-sm-left`)
            ?.textContent.replaceAll("\n", "")
            .replaceAll(",", "");
        }, prod);

        const address = await page.evaluate((prod) => {
          return prod
            .querySelector(`.wp-block-content .voffset-bottom-10 strong`)
            ?.textContent.trim();
        }, prod);

        const description = await page.evaluate((prod) => {
          return prod
            .querySelector(`.wp-block-content [itemprop="description"]`)
            ?.textContent.replaceAll("\n", "")
            .trim();
        }, prod);

        const phoneNumber = await page.evaluate((prod) => {
          return prod
            .querySelector(`.wp-block-content .marketed-by strong`)
            ?.textContent.trim();
        }, prod);

        const noOfBedRooms = await page.evaluate((prod) => {
          return prod
            .querySelectorAll(`.wp-block-footer .aux-info li`)[0]
            .textContent.trim();
        }, prod);

        const noOfBadRooms = await page.evaluate((prod) => {
          return prod
            .querySelectorAll(`.wp-block-footer .aux-info li`)[1]
            .textContent.trim();
        }, prod);

        const imageUrl = await page.evaluate((prod) => {
          return prod
            .querySelector(`.wp-block-img-container [itemprop="image"]`)
            .getAttribute("src");
        }, prod);

        houseDataCollections.push({
          title,
          price,
          address,
          phoneNumber,
          noOfBedRooms,
          noOfBadRooms,
          imageUrl,
          description,
        });
      }

      const csv = parse(houseDataCollections);
      writeFileSync("housedata.csv", csv);

      console.log(`Page ${currentPage} scraped successfully.`);
      await page.close(); // Close the current page
      currentPage++;
    }
  } catch (error) {
    console.error(`Error occurred while scraping: ${error.message}`);
  } finally {
    await browser.close();
    console.log(
      `Scraping complete. Total products scraped: ${houseDataCollections.length}`
    );
  }

  console.log(houseDataCollections);
})();
