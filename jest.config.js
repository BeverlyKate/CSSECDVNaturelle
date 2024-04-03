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
          //outputDirectory: "./test-results/jest", // Specify the output directory for the JUnit XML report
          //outputName: "results.xml", // Specify the output file name for the JUnit XML report
        },
      ],
    ],
  };
  