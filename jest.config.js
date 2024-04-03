// configurating jest to generate custom JUnit XML reports
module.exports = {
    reporters: [
      "default",
      [
        "jest-junit",
        {
            //outputDirectory: 'scripts',
            outputName: 'junit.xml'
        }
      ]
    ]
  };
  