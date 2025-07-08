import moment from "moment";

// Normalizes time strings like '9' → '9AM'
export const normalizeTime = (timeStr, defaultAmPm = "am") => {
  if (!timeStr) return null;
  timeStr = timeStr.trim().toLowerCase();
  if (!timeStr.includes("am") && !timeStr.includes("pm")) {
    timeStr += defaultAmPm;
  }
  return timeStr.toUpperCase();
};

// Extracts and returns start and end time from a time range string
export const getStartEndTime = (timeString) => {
  let startTimeStr = "9AM";
  let endTimeStr;

  if (timeString) {
    let timeParts;
    const lower = timeString.toLowerCase();

    if (lower.includes("to")) {
      timeParts = lower.split("to").map((t) => t.trim());
    } else if (lower.includes("-")) {
      timeParts = lower.split("-").map((t) => t.trim());
    } else {
      timeParts = [timeString.trim()];
    }

    // Check if AM/PM appears in either part
    const suffixFromEnd = timeParts[1]?.match(/am|pm/i)?.[0] || "am";

    const start = moment(normalizeTime(timeParts[0], suffixFromEnd), ["hA", "h:mmA"]);
    startTimeStr = start.format("h:mmA");

    if (timeParts.length > 1) {
      const end = moment(normalizeTime(timeParts[1]), ["hA", "h:mmA"]);
      endTimeStr = end.format("h:mmA");
    } else {
      const end = start.clone().add(1, "hour");
      endTimeStr = end.format("h:mmA");
    }
  }

  return [startTimeStr, endTimeStr];
};


// NEW: Parses and formats an original_time string
export const formatOriginalTimeString = (originalTimeStr) => {
  if (!originalTimeStr) return "Not available";

  // Format 1: "27 June 2025 8:30AM - 12:00PM"
  const regex = /^(\d{1,2} \w+ \d{4}) (\d{1,2}:\d{2}[APMapm]{2}) - (\d{1,2}:\d{2}[APMapm]{2})$/;
  const match = originalTimeStr.match(regex);

  if (match) {
    const [, datePart, startTime] = match;
    const formattedDate = moment(`${datePart}`, "D MMMM YYYY");
    if (formattedDate.isValid()) {
      return `${formattedDate.format("DD/MM/YYYY")} at ${moment(startTime, "h:mmA").format("h:mmA")}`;
    }
  }

  // Format 2: ISO string or fallback
  const iso = moment(originalTimeStr, moment.ISO_8601, true);
  if (iso.isValid()) {
    return iso.format("DD/MM/YYYY [at] h:mmA");
  }

  return "Not available";
};
