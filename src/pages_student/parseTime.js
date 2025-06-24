import moment from "moment";

export const normalizeTime = (timeStr, defaultAmPm = "am") => {
  if (!timeStr) return null;
  timeStr = timeStr.trim().toLowerCase();
  if (!timeStr.includes("am") && !timeStr.includes("pm")) {
    timeStr += defaultAmPm;
  }
  return timeStr.toUpperCase();
};

export const getStartEndTime = (timeString) => {
  let startTimeStr = "9AM";
  let endTimeStr;

  if (timeString) {
    let timeParts;
    const lower = timeString.toLowerCase();

    if (lower.includes("to")) {
      timeParts = lower.split("to").map((t) => t.trim());
    } else if (lower.includes("-")) {
      timeParts = timeString.split("-").map((t) => t.trim());
    } else {
      timeParts = [timeString.trim()];
    }

    startTimeStr = normalizeTime(timeParts[0], "am");

    if (timeParts.length > 1) {
      endTimeStr = normalizeTime(timeParts[1], startTimeStr.includes("PM") ? "pm" : "am");
    } else {
      const startMoment = moment(startTimeStr, ["hA", "h:mmA", "hhA", "hh:mmA"]);
      const endMoment = startMoment.clone().add(1, "hour");
      endTimeStr = endMoment.format("h:mmA");
    }
  }

  return [startTimeStr, endTimeStr];
};
