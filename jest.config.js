// configurating jest to generate custom JUnit XML reports
module.exports = {
    reporters: [
      "default",
      [
        "jest-junit",
        {
            outputDirectory: 'scripts/reports/',
            outputName: 'jest-junit.xml'
        }
      ]
    ]
  };
  