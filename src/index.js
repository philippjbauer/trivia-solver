const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const Trivia = require("./Trivia");
const trivia = new Trivia();

(async () => {
  const imageName = "trivia.png";
  const base64Name = "trivia.txt";

  try {
    const screencapture = `screencapture -R ${process.argv[2]} ${imageName}`;
    await exec(screencapture);
  } catch (error) {
    console.error(error);
  }

  try {
    const openssl = `openssl base64 -in ${imageName} -out ${base64Name}`;
    await exec(openssl);
  } catch (error) {
    console.error(error);
  }

  fs.readFile(base64Name, "utf8", async (error, base64String) => {
    if (error) {
      console.error(error);
      return;
    }

    try {
      await trivia.answerImage(base64String);
    } catch (error) {
      console.error(error);
    }
  });
})();