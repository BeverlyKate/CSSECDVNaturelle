const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

module.exports = {
  formatDate: function (date) {
    if (!date) return "";
    return dayjs.utc(date).format("MMM DD - h:mm A");
  },
};
