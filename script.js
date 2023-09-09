// Declare the updateTimerId variable at the top
let updateTimerId;

// Declare other global variables at the top
let passedTime = 0; // Initialize passedTime
let isPaused = false; // Flag to indicate if the timer is paused
let arrowKeyPressed = false; // Flag to indicate if an arrow key was pressed
let isOutOfTime = false; // Flag to track if time is out
let isTimeUp = false; // Initialize as false
let isTimerAtZero = false; // Initialize the flag as false
let shapesCompleted = false; // Initialize as false
let currentShapeTimeoutId; // Timeout ID for controlling shape drawing
let startTime; // Start time of shape drawing

// Call the updateTimer function to start the countdown
updateTimerId = setInterval(updateTimer, 100);

// Wrap JavaScript code inside a DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", function() {
  // Set up the canvas and declare the ctx variable
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d"); // Define the ctx variable

  let selectedConfidence = 0; // Initialize with a default value
  let countdownMilliseconds; // Countdown duration in milliseconds
  let remainingMilliseconds; // Remaining milliseconds on the countdown

  // Get references to the confidence page number buttons
  const confidencePageButtons = document.querySelectorAll('.confidence-page-button');

  // Attach event listeners to the confidence page number buttons
  confidencePageButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      // Handle button click here
      // Show the "next trial" page or perform other actions as needed
      // You can add code to show the "next trial" page here
      restartShapes();
    });
  });

  // Define the shapes and their corresponding log likelihood ratios
  const shapes = [
    {shape: "hexagon", llr: -0.9},
    {shape: "circle", llr: -0.7},
    {shape: "square", llr: -0.5},
    {shape: "triangle", llr: -0.3},
    {shape: "rectangle", llr: 0.3},
    {shape: "semicircle", llr: 0.5},
    {shape: "heart", llr: 0.7},
    {shape: "star", llr: 0.9}
  ];

  // Initialize variables
  let shapeCounter = 0; // Counter variable for the number of shapes drawn
  const shapeDelay = 500; // Delay between showing shapes in ms
  const maxShapes = 20; // Max number of shapes (20)

  // Function to continue to the next trial
  function continueToNextTrial() {
    // Remove the "Oh dear" page
    const ohNoPage = document.getElementById("oh-no-page");
    if (ohNoPage) {
      document.body.removeChild(ohNoPage);
    }

    // Reset variables and restart the shapes/timer sequence
    shapeCounter = 0;
    shapesCompleted = false;
    passedTime = 0;
    isPaused = false;
    arrowKeyPressed = false;
    isOutOfTime = false;

    // Restart the shapes/timer sequence for the next trial
    startShapesTimer();

    // Log a message to confirm that the function is being called
    console.log("Continuing to next trial...");
  }

  // Function to handle the "Oh dear" message when the timer reaches 0
  function outOfTimeMessage() {
    if (!isOutOfTime) {
      // Hide elements and stop drawing
      stopDrawing();
      isPaused = true;
      clearTimeout(currentShapeTimeoutId);

      // Set the flag to indicate that the timer is at 0
      isTimerAtZero = true;

      // Check if the "Continue" button exists before adding the event listener
      const continueButton = document.getElementById("continue-button");
      if (continueButton) {
        continueButton.addEventListener("click", continueToNextTrial);
      }
    }
  }

  // Function to update the timer display and timer bar
  function updateTimerDisplay() {
    const timerBar = document.getElementById("timer-bar");
    const currentTime = Date.now();
    passedTime = currentTime - startTime;
    let remainingMilliseconds = countdownMilliseconds - passedTime;
    remainingMilliseconds = Math.max(remainingMilliseconds, 0);

    const totalMilliseconds = countdownMilliseconds;
    const filledPercentage = ((totalMilliseconds - passedTime) / totalMilliseconds) * 100;
    timerBar.style.width = `${filledPercentage}%`;

    const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
    document.getElementById("timer").textContent = remainingSeconds;

    if (remainingMilliseconds <= 0) {
      timerBar.style.width = "0%";
      console.log('Time is up!');
      clearInterval(updateTimerId);
      outOfTimeMessage();
      stopDrawing();
      isTimeUp = true; // Set the isTimeUp variable to true
    } else {
      // Show the timer bar container when the timer is above 0
      document.getElementById("timer-bar-container").classList.remove("hidden");

      // Hide the "Oh dear" page if the timer is not at 0
      if (isTimerAtZero) {
        const ohNoPage = document.getElementById("oh-no-page");
        if (ohNoPage) {
          document.body.removeChild(ohNoPage);
        }
        isTimerAtZero = false; // Reset the flag
      }
    }
  }

  // Define the function to draw a shape at the center of the canvas
  function drawShape() {
    // Check if the confidence page is being displayed
    if (document.getElementById("confidence").style.display === "block") {
      return; // Do not continue drawing shapes if on confidence page
    }

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate a random shape index
    const randomShapeIndex = Math.floor(Math.random() * shapes.length);

    // Call updateTimerDisplay to update the timer display
    updateTimerDisplay();

    // Get the current shape and its log likelihood ratio
    const currentShape = shapes[randomShapeIndex];
    const currentShapeLLR = currentShape.llr;

    // Calculate the concentration value based on the LLR
    const concentration = Math.abs(currentShapeLLR) * 75;

    // Calculate the color based on the concentration value and LLR sign
    let color;

    if (currentShapeLLR < 0) {
      color = `rgba(0, 0, 255, ${concentration / 100})`; // Blue color
    } else {
      color = `rgba(255, 0, 0, ${concentration / 100})`; // Red color
    }

    // Draw the current shape at the center of the canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = 100;

    ctx.beginPath();

    switch (currentShape.shape) {
      case "hexagon":
        ctx.moveTo(centerX + size/2 * Math.cos(0), centerY + size/2 * Math.sin(0));
        for (let i = 1; i <= 6; i++) {
          ctx.lineTo(centerX + size/2 * Math.cos(i * 2 * Math.PI / 6), centerY + size/2 * Math.sin(i * 2 * Math.PI / 6));
        }
        break;

      case "circle":
        ctx.arc(centerX, centerY, size / 2, 0, 2 * Math.PI);
        break;

      case "square":
        ctx.rect(centerX - size / 2, centerY - size / 2, size, size);
        break;

      case "triangle":
        ctx.moveTo(centerX, centerY - size / 2);
        ctx.lineTo(centerX + size / 2, centerY + size / 2);
        ctx.lineTo(centerX - size / 2, centerY + size / 2);
        ctx.closePath();
        break;

      case "rectangle":
        ctx.rect(centerX - size/1.5, centerY - size / 3, 2 * size/1.5, size/1.5);
        break;

      case "semicircle":
        ctx.arc(centerX, centerY, size / 2, 0, Math.PI, true);
        break;

      case "heart":
        ctx.moveTo(centerX, centerY + size / 4);
        ctx.bezierCurveTo(centerX - size / 2, centerY - size / 2, centerX - size, centerY - size / 4, centerX, centerY + size / 2);
        ctx.bezierCurveTo(centerX + size, centerY - size / 4, centerX + size / 2, centerY - size / 2, centerX, centerY + size / 4);
        break;

      case "star":
        const innerRadius = size / 4;
        const outerRadius = size/2;
        const spikes = 5;
        const rotation = Math.PI / 2;

        ctx.moveTo(centerX + outerRadius * Math.cos(rotation), centerY + outerRadius * Math.sin(rotation));

        for (let i = 0; i < spikes; i++) {
          const outerX = centerX + outerRadius * Math.cos(rotation + (i * 2 * Math.PI / spikes));
          const outerY = centerY + outerRadius * Math.sin(rotation + (i * 2 * Math.PI / spikes));
          ctx.lineTo(outerX, outerY);

          const innerX = centerX + innerRadius * Math.cos(rotation + ((i + 0.5) * 2 * Math.PI / spikes));
          const innerY = centerY + innerRadius * Math.sin(rotation + ((i + 0.5) * 2 * Math.PI / spikes));
          ctx.lineTo(innerX, innerY);
        }
        break;
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Output the value of the current shape to the console
    console.log("Current shape value:", currentShapeLLR);

    // Increment the shape counter
    shapeCounter++;

    // Check if the maximum number of shapes has been reached
    if (shapeCounter < maxShapes) {
      // Schedule the next shape to be drawn after the delay and pause
      setTimeout(() => {
        // Clear the canvas before displaying the next shape
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Schedule the next shape to be drawn after the standard delay and pause
        setTimeout(drawShape, shapeDelay + 100); // shapeDelay + 100 ms pause
      }, 500); // 500 ms delay before the first shape
    } else {
      // All shapes have been drawn, make the entire screen blank
      document.getElementById("overlay").style.display = "block";
      document.getElementById("confidence").style.display = "block";
    }
  }

  // Start drawing shapes
  startTime = Date.now();
  drawShape();

  // Randomize the countdown duration between 5000 and 10000 milliseconds
  countdownMilliseconds = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
  // Calculate the remaining milliseconds on the countdown
  remainingMilliseconds = countdownMilliseconds - (Date.now() - startTime);

  // Display and update the countdown timer
  const timerElement = document.getElementById("timer");
  timerElement.textContent = remainingMilliseconds;

  // Hide the timer bar container when an arrow key is pressed
  document.getElementById("timer-bar-container").classList.add("hidden");

  // Function to restart the original shapes and timer sequence
  function restartShapes() {
    // Reset canvas and other elements
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("overlay").style.display = "none";
    document.getElementById("confidence").style.display = "none";
    document.getElementById("letter-blue").style.display = "block";
    document.getElementById("letter-red").style.display = "block";
    document.getElementById("timer").style.display = "block";

    // Update countdownMilliseconds and remainingMilliseconds
    countdownMilliseconds = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    remainingMilliseconds = countdownMilliseconds;

    // Restart drawing shapes
    shapeCounter = 0;
    document.body.style.backgroundColor = "transparent"; // Reset background color
    drawShape(); // Call drawShape directly
    startTime = Date.now();

    // Update and display the countdown timer
    const timerElement = document.getElementById("timer");
    timerElement.textContent = Math.ceil(remainingMilliseconds / 1000);

    // Call the updateTimerDisplay function initially to start updating the timer display
    updateTimerDisplay();
  }

  // Function to stop drawing shapes and show confidence message
  function stopDrawing() {
    clearTimeout(currentShapeTimeoutId); // Stop further shape drawing
    document.getElementById("confidence").style.display = "block"; // Display the confidence message
    document.getElementById("letter-blue").style.display = "none"; // Hide blue letter
    document.getElementById("letter-red").style.display = "none"; // Hide red letter
    document.getElementById("canvas").style.display = "none"; // Hide canvas
    document.getElementById("timer").style.display = "none"; // Hide timer
  }

  // Function to submit confidence and show success page
  function submitConfidence(confidence) {
    // Hide all the elements on the screen
    document.getElementById("letter-blue").style.display = "none";
    document.getElementById("letter-red").style.display = "none";
    document.getElementById("canvas").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.getElementById("timer").style.display = "none";
    document.getElementById("confidence").style.display = "none";

    // Display the success page with "Good job" message
    const successPage = document.getElementById("success-page");
    successPage.style.display = "block";

    // Hide the "Continue" button on the success page
    const nextTrialButton = document.getElementById("next-trial-button");
    nextTrialButton.addEventListener("click", restartShapes);

    // Add event listener to the "Next Trial" button to restart the sequence
    nextTrialButton.addEventListener("click", function() {
    // Hide the success page
    successPage.style.display = "none";

    // Reset variables and restart the shapes/timer sequence
    shapeCounter = 0;
    shapesCompleted = false;
    passedTime = 0;
    isPaused = false;
    arrowKeyPressed = false;
    isOutOfTime = false;

    // Restart the shapes/timer sequence for the next trial
    startShapesTimer();

    // Log the selected confidence value to the console
    console.log("Selected confidence:", confidence);

    // Hide the confidence page
    document.getElementById("confidence").style.display = "none";

    // Show the success page
    document.getElementById("success-page").style.display = "block";
  });

  // Function to restart the original shapes and timer sequence
  function restartOriginalSequence() {
    // Hide the success page
    document.getElementById("success-page").style.display = "none";

    // Reset any necessary variables or states
    shapeCounter = 0;
    shapesCompleted = false;
    passedTime = 0;
    isPaused = false;
    arrowKeyPressed = false;
    isOutOfTime = false;

    // Restart the shapes and timer sequence
    startShapesTimer();
  }

  // Declare the updateTimerId variable at the top
  updateTimerId = setInterval(() => {
    let currentTime = new Date().getTime();
    let remainingMilliseconds = countdownMilliseconds - passedTime; // Note: passedTime is not defined

    // Convert milliseconds to seconds, then round down
    let remainingSeconds = Math.floor(remainingMilliseconds / 1000);

    // Display the remaining time
    console.log(`Time remaining: ${remainingSeconds} seconds`);

    // Stop the countdown at zero
    if (remainingMilliseconds <= 0) {
      console.log('Time is up!');
      // Here is where you'd likely want to clear the interval
      clearInterval(updateTimerId);
    }
  }, 1000);

  // Function to update the timer display and timer bar
  function updateTimerDisplay() {
    const timerBar = document.getElementById("timer-bar");
    const currentTime = Date.now();
    passedTime = currentTime - startTime;
    let remainingMilliseconds = countdownMilliseconds - passedTime;
    remainingMilliseconds = Math.max(remainingMilliseconds, 0);

    const totalMilliseconds = countdownMilliseconds;
    const filledPercentage = ((totalMilliseconds - passedTime) / totalMilliseconds) * 100;
    timerBar.style.width = `${filledPercentage}%`;

    const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
    document.getElementById("timer").textContent = remainingSeconds;

    if (remainingMilliseconds <= 0) {
      timerBar.style.width = "0%";
      console.log('Time is up!');
      clearInterval(updateTimerId);
      outOfTimeMessage();
      stopDrawing();
      isTimeUp = true; // Set the isTimeUp variable to true
    } else {
      // Show the timer bar container when the timer is above 0
      document.getElementById("timer-bar-container").classList.remove("hidden");

      // Hide the "Oh dear" page if the timer is not at 0
      if (isTimerAtZero) {
        const ohNoPage = document.getElementById("oh-no-page");
        if (ohNoPage) {
          document.body.removeChild(ohNoPage);
        }
        isTimerAtZero = false; // Reset the flag
      }
    }
  }

  // Function to update the timer and check if time is up
  function updateTimer() {
    if (!isPaused) {
      let currentTime = new Date().getTime();
      let remainingMilliseconds = countdownMilliseconds - passedTime;

      // Display the remaining time in milliseconds
      console.log(`Time remaining: ${remainingMilliseconds} milliseconds`);

      // Stop the countdown at zero
      if (remainingMilliseconds <= 0) {
        console.log('Time is up!');
        // Stop updating the timer display
        clearInterval(updateTimerId);
        // Mark that time is out
        isOutOfTime = true;
        // Display the "Oh dear" page if no arrow key was pressed
        if (!arrowKeyPressed) {
          outOfTimeMessage();
        }
      }
    }
  }

  // Function to handle arrow key presses and show the confidence page
  //function showConfidencePage() {
  //  if (!isPaused) {
  //    isPaused = true; // Pause the timer
//      clearTimeout(currentShapeTimeoutId); // Stop further shape drawing
//    }

    // Hide all the elements on the screen
//    document.getElementById("letter-blue").style.display = "none";
//    document.getElementById("letter-red").style.display = "none";
//    document.getElementById("canvas").style.display = "none";
//    document.getElementById("overlay").style.display = "none";
//    document.getElementById("timer").style.display = "none";

    // Check if the timer has not reached 0 before showing the confidence page
//    if (remainingMilliseconds > 0) {
//      document.getElementById("confidence").style.display = "block"; // Display the confidence page
//    } else {
//      outOfTimeMessage(); // Display the "Oh dear" message
//    }
//  }

  // Function to handle arrow key presses and show the confidence page
  function showConfidencePage(event) {
    if (!isPaused) {
      isPaused = true; // Pause the timer
      clearTimeout(currentShapeTimeoutId);

      const arrowPressed = event.code === "ArrowLeft" ? 0 : 1;
      console.log(`Arrow ${arrowPressed} key pressed`); // Log the event

      // Show the confidence page without resetting the timer
      document.getElementById("confidence").style.display = "block"; // Display the confidence page

      // Check if the continueButton element exists before adding the event listener
      const continueButton = document.getElementById("continue-button");
      if (continueButton) {
        continueButton.addEventListener("click", continueToNextTrial);
      }
    }
  }

  // Call the updateTimer function to start the countdown
  startTime = Date.now(); // Set the start time

  // Function to start the shapes/timer sequence
  function startShapesTimer() {
    // Reset canvas and other elements
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("overlay").style.display = "none";
    document.getElementById("confidence").style.display = "none";
    document.getElementById("letter-blue").style.display = "block";
    document.getElementById("letter-red").style.display = "block";
    document.getElementById("timer").style.display = "block";

    // Update countdownMilliseconds and remainingMilliseconds
    countdownMilliseconds = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
    remainingMilliseconds = countdownMilliseconds;

    // Restart drawing shapes
    shapeCounter = 0;
    document.body.style.backgroundColor = "transparent"; // Reset background color
    drawShape(); // Call drawShape directly
    startTime = Date.now();

    // Update and display the countdown timer
    const timerElement = document.getElementById("timer");
    timerElement.textContent = Math.ceil(remainingMilliseconds / 1000);

    // Call the updateTimerDisplay function initially to start updating the timer display
    updateTimerDisplay();
  }

  // Add event listener for arrow key presses
  //window.addEventListener("keydown", function(event) {
    //if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      // Pause the timer and shape drawing
    //  isPaused = true;
      //clearTimeout(currentShapeTimeoutId);

      //const arrowPressed = event.code === "ArrowLeft" ? 0 : 1;
      //console.log(`Arrow ${arrowPressed} key pressed`); // Log the event

      // Show the confidence page without resetting the timer
    //  showConfidencePage(event);

      // Check if the continueButton element exists before adding the event listener
    //  const continueButton = document.getElementById("continue-button");
    //  if (continueButton) {
      //  continueButton.addEventListener("click", continueToNextTrial);
    //  }
  //  }
//  });

  // Add event listener for arrow key presses
  window.addEventListener("keydown", function(event) {
    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      // Call the showConfidencePage function and pass the event object
      showConfidencePage(event);
    }
  });

  const continueButton = document.getElementById("continue-button");
  continueButton.addEventListener("click", continueToNextTrial);

  // Function to handle the confidence submission
  function handleConfidenceSubmission(confidence) {
    // Handle the user's confidence value here

    // Run the shapes/timer sequence again
    startShapesTimer();
  }

  // Function to start the confidence page
  function startConfidencePage() {
    document.getElementById("letter-blue").style.display = "none";
    document.getElementById("letter-red").style.display = "none";
    document.getElementById("canvas").style.display = "none";
    document.getElementById("overlay").style.display = "none";
    document.getElementById("timer").style.display = "none";
    document.getElementById("confidence").style.display = "block";
  }

  // Call the updateTimer function to start the countdown
  updateTimerId = setInterval(updateTimer, 100);

  // Wrap the main code inside a function that handles the repeating pattern
  function runPattern() {
    // Declare countdownMilliseconds and remainingMilliseconds
    let countdownMilliseconds;
    let remainingMilliseconds;

    // Call the startShapesTimer function initially to start the sequence
    startShapesTimer();

    // Check if the canvas element exists before calling startShapesTimer
    const canvas = document.getElementById("canvas");
    if (canvas) {
      // Call the startShapesTimer function initially to start the sequence
      startShapesTimer();
    }
  }

  // Call the runPattern function to start the repeating pattern
  runPattern();
}
// Close the DOMContentLoaded event listener
});
