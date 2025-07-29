import * as XLSX from "xlsx";

export async function parseBlockedDates(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array", cellStyles: true });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
            console.log("📄 Rows from Excel:", rows);

            const calendarDates = [];
            const monthMap = {
                Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
                Jul: 7, Aug: 8, Sep: 9, Sept: 9, Oct: 10, Nov: 11, Dec: 12,
            };

            // 1. Extract all real or parseable date cells from columns A–G only (Mon–Fri area)
            for (const row of rows) {
                for (let i = 0; i < 7; i++) {
                    const cell = row[i];
                    if (cell instanceof Date) {
                        calendarDates.push(cell);
                    } else if (typeof cell === "number") {
                        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                        const parsed = new Date(excelEpoch.getTime() + cell * 86400 * 1000);
                        if (!isNaN(parsed.getTime())) calendarDates.push(parsed);
                    } else if (typeof cell === "string") {
                        const match = cell.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)(?:\s+(\d{2,4}))?/i);
                        if (match) {
                            const [, day, mon, yearStr] = match;
                            const year = parseInt(yearStr) || new Date().getFullYear();
                            const monthIndex = monthMap[mon];
                            const parsed = new Date(year, monthIndex - 1, parseInt(day));
                            if (!isNaN(parsed.getTime())) calendarDates.push(parsed);
                        }
                    }
                }
            }

            console.log("📅 Calendar Dates Extracted:", calendarDates);
            const finalPayload = [];

            // 2. Parse column H for remarks (index 7)
            for (const row of rows) {
                const remark = row[7];
                if (typeof remark !== "string") continue;

                console.log("📝 Processing remark:", remark);
                const cleaned = remark.replace(/[\u2013\u2014\u2212]/g, "-").trim();

                // Case: HOR Week / CBL Week
                if (/HOR Week|CBL Week/.test(cleaned)) {
                    for (let i = 0; i < 7; i++) {
                        const dateCandidate = row[i];
                        if (dateCandidate instanceof Date) {
                            finalPayload.push({
                                date: dateCandidate.toISOString().split("T")[0],
                                remark: cleaned
                            });
                        }
                    }
                    continue;
                }

                // Case: Single dates
                const singles = [...cleaned.matchAll(/\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\b/gi)];
                for (const [, dayStr, month] of singles) {
                    const day = parseInt(dayStr);
                    calendarDates.forEach(dt => {
                        if (dt.getDate() === day && dt.getMonth() + 1 === monthMap[month]) {
                            finalPayload.push({ date: dt.toISOString().split("T")[0], remark: cleaned });
                        }
                    });
                }

                // Case: Ranges like 12-15 Feb or 12 Feb to 15 Feb
                const ranges = [...cleaned.matchAll(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)/gi)];
                for (const [, startStr, endStr, month] of ranges) {
                    const start = parseInt(startStr);
                    const end = parseInt(endStr);
                    calendarDates.forEach(dt => {
                        if (
                            dt.getMonth() + 1 === monthMap[month] &&
                            dt.getDate() >= start &&
                            dt.getDate() <= end
                        ) {
                            finalPayload.push({ date: dt.toISOString().split("T")[0], remark: cleaned });
                        }
                    });
                }
            }

            // 3. Deduplicate
            const seen = new Set();
            const deduped = finalPayload.filter(({ date, remark }) => {
                const key = `${date}_${remark}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            resolve(deduped);
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
}
