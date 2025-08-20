import * as cheerio from "cheerio";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

interface EntityType {
  href: string | null;
  dateText: string;
  votingDate: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Entrypoint: fetch the latest meeting date, download the corresponding PDF,
  // and log structured JSON output for liqour-license-applicant-pipeline workflow.
  const url =
    "https://www.boston.gov/departments/licensing-board/licensing-board-information-and-members";
  try {
    const pdfDate = await getLatestDate(url);
    const fileName = await downloadVotingMinutes(pdfDate, url);
    const result = {
      success: true,
      pdfDate: pdfDate.toISOString(),
      fileName: fileName,
      message: "Downloaded the pdf successfully",
    };
    console.log("::JSON_OUTPUT::" + JSON.stringify(result));
  } catch (err) {
    const errResult = {
      success: false,
      pdfDate: null,
      fileName: null,
      message: String(err),
    };
    console.error("::JSON_OUTPUT::" + JSON.stringify(errResult));
    throw err;
  }
}

async function downloadVotingMinutes(
  pdfDate: Date,
  url: string
): Promise<string> {
  const regex = /Voting Minutes:\s+\w+,\s+([A-Za-z]+)\s+(\d{1,2})/;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  // Locate the container that has the list of past Voting Minutes for the current year
  const votingMinuteSection = $("section#content")
    .find(".paragraphs-item-drawers")
    .last()
    .find(
      `.paragraphs-item-drawer .field.field-label-hidden div:contains('${currentYear}')` // Label element containing the current year
    )
    .closest(".paragraphs-item-drawer");

  if (!votingMinuteSection.length) {
    throw Error(`Could not find the section with the year ${currentYear}`);
  }

  let entity = {} as EntityType;
  $(votingMinuteSection)
    .find("ul li a")
    .each((_, e) => {
      const dateText = $(e).text();
      const match = dateText.match(regex);
      if (match) {
        const month = match[1];
        const day = parseInt(match[2]);
        const year = currentYear;
        const date = new Date(`${month} ${day}, ${year}`);
        console.log(`date checked is ${date}`);
        if (date.getTime() === pdfDate.getTime()) {
          console.log(`date matched is ${date}`);
          console.log("url matched is ", $(e).attr("href"));
          entity["href"] = $(e).attr("href") ?? null;
          entity["dateText"] = $(e).text();
          entity["votingDate"] = date.toISOString();
        }
      }
    });

  if (!entity || !entity["href"]) {
    // If this happens, the meeting date exists on the site but has no PDF link yet
    throw Error("Could not find entity");
  }
  const mainUrl = "https://www.boston.gov/";
  const fullUrl = new URL(entity["href"], mainUrl).toString();
  const pdfData = await axios.get(fullUrl, {
    responseType: "arraybuffer",
  });
  console.log("pdf data is ", pdfData.data);
  const fileName = entity["href"].split("/").pop();
  console.log("file name is ", fileName);
  if (fileName) {
    const filePath = path.join(__dirname, fileName);
    await fs.writeFile(filePath, pdfData.data);
  } else {
    throw Error("could not get the file name");
  }

  return fileName;
}

/**
 * Determines the most recent past meeting date that has already occurred.
 * If the latest processed date matches it, the script terminates early
 * to avoid redundant downloads.
 */
async function getLatestDate(url: string) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const response = await axios.get(url);
  const $ = cheerio.load(response.data);

  const currentYearElement = $("section#content") // Main page content
    .find(".paragraphs-item-drawers")
    .first() // Upcoming Hearing Dates
    .find(
      `.paragraphs-item-drawer .field.field-label-hidden div:contains('${currentYear}')` // Label element containing the current year
    )
    .parentsUntil(".section-drawers") // Lowest common ancestor of the label element and the list of dates
    .find(".entity .field ul"); // List of dates

  const currentDateStrings = currentYearElement
    .text()
    .split("\n")
    .filter((dateString) => !!dateString && dateString.includes("Voting"))
    .map((dateString) => dateString.replace(/\(Voting\)/g, "").trim());

  const meetingDates = currentDateStrings.map(
    (dateString) => new Date(`${dateString}, ${currentYear}`)
  );

  // Only consider meetings that have already happened
  const pastDates = meetingDates.filter((date) => date <= currentDate);
  const maxPastDate = new Date(Math.max(...pastDates.map((d) => d.getTime())));

  const lastProcessedDate = await getWrittenLatestDate();
  if (lastProcessedDate.getTime() === maxPastDate.getTime()) {
    throw new Error("No new date found to add entities");
  }

  return maxPastDate;
}

async function getWrittenLatestDate() {
  const dateFilePath = path.join(__dirname, "../data/last_processed_date.json");
  const data = await fs.readFile(dateFilePath, "utf-8");
  const parsed = JSON.parse(data);
  const lastestDate = new Date(parsed.date);
  return lastestDate;
}

await main();
