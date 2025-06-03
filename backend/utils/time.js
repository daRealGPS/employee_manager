
function getTimezoneSpecificDayRange(baseDate = new Date(), timezone = 'Asia/Kolkata', locale = 'en-US') {
  const timezoneSpecificString = baseDate.toLocaleString(locale, { timeZone: timezone });
  const timezoneSpecificDate = new Date(timezoneSpecificString);

  const startTimezoneSpecific = new Date(timezoneSpecificDate);
  startTimezoneSpecific.setHours(0, 0, 0, 0);

  const endTimezoneSpecific = new Date(timezoneSpecificDate);
  endTimezoneSpecific.setHours(23, 59, 59, 999);

  return {
    startISO: startTimezoneSpecific.toISOString(),
    endISO: endTimezoneSpecific.toISOString(),
  };
}

module.exports = getTimezoneSpecificDayRange;
