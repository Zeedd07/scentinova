export const shortDateFmt = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  day: "numeric",
  timeZone: "Asia/Kolkata",
});

export const weekdayDateFmt = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Kolkata",
});

export const hmsTimeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

// `Intl.NumberFormat.prototype.format` is a bound getter — safe to extract.
export const intFmt = new Intl.NumberFormat("en-IN").format;
