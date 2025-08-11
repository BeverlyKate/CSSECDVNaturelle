const ValidationRule = {
  Required: "required",
  InvalidTypeNotAString: "invalid_type_not_a_string",
  InvalidTypeNotANumber: "invalid_type_not_a_number",
  InvalidTypeNotAnArray: "invalid_type_not_an_array",
  InvalidTypeNotABoolean: "invalid_type_not_a_boolean",
  InvalidTypeNotAnObjectId: "invalid_type_not_an_object_id",
  InvalidTypeNotADate: "invalid_type_not_a_date",
  InvalidFormat: "invalid_format",
  InvalidLengthMin: "invalid_length_min",
  InvalidLengthMax: "invalid_length_max",
  InvalidValueMin: "invalid_value_min",
  InvalidValueMax: "invalid_value_max",
  InvalidFormatEmail: "invalid_format_email",
  InvalidFormatPhone: "invalid_format_phone",
  InvalidFormatDate: "invalid_format_date",
  InvalidCharacters: "invalid_characters",
  RegexMismatch: "regex_mismatch",
  EnumMismatch: "enum_mismatch",
  InvalidRange: "invalid_range",
  DateInPast: "date_in_past",
  DateInFuture: "date_in_future",
  StartDateAfterEndDate: "start_date_after_end_date",
  ValueNotUnique: "value_not_unique",

  // Reservation input validation
  DateSameDay: "date_same_day",
  DateLessThanTwoWeeks: "date_less_than_two_weeks",
};

async function logInputValidation(
  userId,
  endpoint,
  fieldName,
  validationRule,
  inputValue,
  message
) {
  const Logs_InputValidation = require("../models/Logs_InputValidation");

  try {
    const log = new Logs_InputValidation({
      timestamp: new Date(),
      userId: userId,
      endpoint: endpoint,
      fieldName: fieldName,
      validationRule: validationRule,
      inputValue: inputValue,
      message: message,
    });
    ////console.log("util: " + log.userId);
    await log.save();
    ////console.log("Input validation log saved successfully.");
  } catch (error) {
    console.error("Error saving input validation log:", error);
  }
}

module.exports = {
  ValidationRule,
  logInputValidation,
};
