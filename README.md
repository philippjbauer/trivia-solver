# Trivia Game Solver
This is a project to guess answers for trivia type games like, "Who wants to be a Millionaire?" or "HQ Trivia". Do not use this for live games as it most certainly is not prohibited to use a tool.
I thought this to be an interesting problem because it involves the use of OCR and Googles' Custom Search API.
Shortly after I was done with this I discovered the amount of people motivated to solve this was/is quite big. The approach people came up with is very similar to / the same as mine. See: https://www.youtube.com/watch?v=6GjaUu9tOaA

## Compability
This code works untranspiled with NodeJS v10 on MacOS High Sierra (< 10.13 is untested). It will not work on other platforms as it uses the native screencapture tool of MacOS. Provisions for transpiling the code exist but went unused, you can try to use it for NodeJS < v10.

## Install
Copy or clone the repository, then set up the Vision and Custom Search API in your Google Cloud. Copy or rename `src/config.example.js` to `src/config.js` and enter your Google credentials.

## Usage
Open a terminal, navigate to the folder you saved the script in and execute `node src/index.js x,y,w,h` where x,y,w,h are the coordinates and dimensions of the portion of the screen you want to capture (the part with a question). Wait and make a judgement if the answer is correct.

## Disclaimer
Again, do not use this software to cheat at "HQ Trivia" or similar games! This is for education purposes only!