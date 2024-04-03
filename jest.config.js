// configurating jest to generate custom JUnit XML reports
module.exports = {
    reporters: [
      "default",
      [
        "jest-junit",
        {
          suiteNameTemplate: "{filename}", 
          classNameTemplate: "{ancestorTitles}", 
          titleTemplate: "{title}"
        },
      ],
    ],
  };
  