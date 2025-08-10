const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

module.exports = {
  formatDate: function (date) {
    if (!date) return "";
    return dayjs.utc(date).tz("Asia/Manila").format("MMM DD - h:mm A");
  },
};
