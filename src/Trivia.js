const https = require("https");
const config = require("./config");

module.exports = class Trivia {
  constructor() {
    this._baseUrl = `https://www.googleapis.com/customsearch/v1?key=${config.API_KEY}&cx=${config.CSE_CREATOR}:${config.CSE_ID}`;
    this._sorting = "DESC";
  }

  async answerImage(image = null) {
    const base64image = image || require("./base64test");
    const payload = JSON.stringify({
      "requests": [{
          "image": {"content": base64image},
          "features": [{"type": "TEXT_DETECTION"}]
        }]
    });

    const options = {
      hostname: "vision.googleapis.com",
      port: 443,
      path: `/v1/images:annotate?key=${config.API_KEY}`,
      method: "POST",
      headers: {
        "Content-Type": "image/png",
        "Content-Length": Buffer.byteLength(payload)
      }
    };

    try {
      const result = await new Promise((resolve, reject) => {
        const request = https.request(options, response => {
          let data = [];
          return response
            .on("data", chunk => { data.push(chunk); })
            .on("end", () => { resolve(JSON.parse(data.join(""))); })
            .on("error", error => { reject(error); });
        });

        request.write(payload);
        request.end();
      });

      const pieces = result.responses[0].fullTextAnnotation.text
        .split("\n")
        .filter(n => n !== "")
        .reverse();

      const [three, two, one, ...questionParts] = pieces;
      const answers = [one, two, three];
      const question = questionParts.reverse().join(" ").replace("'", "");

      await this.answer(question, answers);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   *Answer a Trivia Question
   *
   * @param {String} question
   * @param {Array} answers
   */
  async answer(question, answers) {
    try {
      console.log(`${question}:\n${answers.join(", ")}\n`);
      // Sort ascending when "NOT" was found in question
      this.setSorting(question);
      answers = this.transformAnswers(answers);

      // Start these processes simultaneously
      const frequency = this.frequency(question, answers);
      const hits = this.hits(question, answers);

      // Wait for processes to finish
      const results = [
        await frequency,
        await hits
      ];

      // Final output to the terminal
      console.log(results);
      console.log(`\nAnswer: ${(this._sorting === "DESC" && results[0][0] === 0) ? results[1][1] : results[0][1]}`);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Search Question
   * Ask Google Custom Search for answers to our question
   *
   * @param {String} question
   * @param {String} appendix
   * @param {String} num
   * @returns {Promise}
   */
  async search(query, fields = null) {
    let url = `${this._baseUrl}&q=${encodeURIComponent(query)}`;

    if (fields) {
      url += `&fields=${fields}`;
    }

    return new Promise((resolve, reject) => {
      https.get(url, response => {
        let raw = [];

        response
          .on("data", chunk => { raw.push(chunk); })
          .on("end", () => {
            const data = JSON.parse(raw.join(""));

            if (data.error) {
              reject(data.error);
            } else {
              resolve(data);
            }

            return false;
          })
          .on("error", error => { reject(error); });
      });
    });
  }

  /**
   * Frequency of answers on result page
   *
   * Use parallel processing to scan the result
   * for frequency of each possible answer.
   * The highest occurance indicates
   * the most likely, correct answer.
   *
   * @param {String} question
   * @param {Array} answers
   * @returns {Number}
   */
  async frequency(question, answers) {
    const query = `${question} "${answers.join("\" OR \"")}"`;
    const result = await this.search(query, "items(title,snippet,link)");

    let snippets = [];
    for (let item of result.items) {
      snippets.push(item.snippet);
    }
    let descriptions = snippets.join(" ");

    // Use a regular expression to count the frquency
    // of an answer. Do it in parallel for all answer
    // possibilities. After all processes are finished,
    // order the Array by the frequency.
    const frequency = (await Promise.all(answers.map(answer => {
      const pattern = new RegExp(answer, "g");
      const matches = descriptions.match(pattern);
      const count = (matches || []).length;

      return [count, answer]; // e.g [5, "Hamburger"]
    }))).sort(this._sorting === "ASC" ? this.sort : this.rsort); // e.g. [[5, "Hamburger"], [2, "Hotdog"], …]

    console.log("Frequency:\n", frequency, "\n");

    return frequency[0];
  }

  /**
   * Hits for question and answer search
   *
   * @param {String} question
   * @param {Array} answers
   * @returns {Number}
   */
  async hits(question, answers) {
    const results = await Promise.all(answers.map(answer => {
      const query = `${question} "${answer}"`;
      return this.search(query, "queries/request(totalResults,searchTerms)");
    }));

    const hits = (await Promise.all(results.map(result => {
      return this.hitsJsonParser(result);
    }))).sort(this._sorting === "ASC" ? this.sort : this.rsort);

    console.log("Hits:\n", hits, "\n");

    return hits[0];
  }

  hitsJsonParser(result) {
    const hits = parseInt(result.queries.request[0].totalResults);
    const terms = result.queries.request[0].searchTerms;

    const pattern = new RegExp("\"([^\"]+)\"$", "g");
    const regexp = pattern.exec(terms);
    const answer = regexp ? regexp[1] : "unknown";

    return [hits, answer];
  }

  sort(a, b) {
    return a[0] - b[0];
  }

  rsort(a, b) {
    return b[0] - a[0];
  }

  setSorting(question) {
    if (question.indexOf(" NOT ") !== -1) {
      this._sorting = "ASC";
    } else {
      this._sorting = "DESC";
    }
  }

  transformAnswers(answers) {
    let result = [];
    for (let i = 0; i < answers.length; i++) {
      if (answers[i].indexOf(" and ") !== -1) {
        result.push(answers[i].replace(" and ", " & "));
      } else if (answers[i].indexOf(" & ") !== -1) {
        result.push(answers[i].replace(" & ", " and "));
      }
      result.push(answers[i]);
    }

    return result;
  }
}