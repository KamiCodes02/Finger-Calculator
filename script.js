// Get HTML elements
var videoElement = document.getElementById('webcam');
var canvasElement = document.getElementById('canvas');
var canvasCtx = canvasElement.getContext('2d');
var resultText = document.getElementById('result');

// Default operation
var currentOperation = '+';

// Change the calculator operation when a button is clicked
function setOperation(operation) {
    currentOperation = operation;
}

// Function to count the number of extended fingers
function countFingers(landmarks, handLabel) {
    var count = 0;
    var tips = [8, 12, 16, 20];
    var base = [6, 10, 14, 18];

    // Thumb logic
    if (handLabel === "Right") {
        if (landmarks[4].x < landmarks[3].x) {
            count++;
        }
    } else {
        if (landmarks[4].x > landmarks[3].x) {
            count++;
        }
    }

    // Count index, middle, ring, and pinky fingers
    for (var i = 0; i < tips.length; i++) {
        if (landmarks[tips[i]].y < landmarks[base[i]].y) {
            count++;
        }
    }
    return count;
}

// Perform the selected calculator operation
function calculate(leftCount, rightCount) {
    var answer;
    var symbol = currentOperation;

    if (currentOperation === '+') {
        answer = leftCount + rightCount;
    } else if (currentOperation === '-') {
        answer = leftCount - rightCount;
    } else if (currentOperation === '*') {
        answer = leftCount * rightCount;
        symbol = '×';
    } else if (currentOperation === '/') {
        symbol = '÷';
        if (rightCount === 0) {
            return leftCount + " " + symbol + " " + rightCount + " = Cannot divide by zero";
        }
        answer = (leftCount / rightCount).toFixed(2);
    } else if (currentOperation === '%') {
        if (rightCount === 0) {
            return leftCount + " % " + rightCount + " = Cannot use modulo by zero";
        }
        answer = leftCount % rightCount;
    } else if (currentOperation === 'pow') {
        symbol = '^';
        answer = Math.pow(leftCount, rightCount);
    }

    return leftCount + " " + symbol + " " + rightCount + " = " + answer;
}

// Configure MediaPipe Hands model
var hands = new Hands({
    locateFile: function (file) {
        return "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" + file;
    }
});

hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

// Process results from the hand tracking model
hands.onResults(function (results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    var leftCount = 0;
    var rightCount = 0;
    var outputText = "";

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (var i = 0; i < results.multiHandLandmarks.length; i++) {
            var landmarks = results.multiHandLandmarks[i];
            var handedness = results.multiHandedness[i].label;

            // Draw hand landmarks and connections
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 3 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 1 });

            var fingerCount = countFingers(landmarks, handedness);

            if (handedness === "Left") {
                leftCount = fingerCount;
            } else if (handedness === "Right") {
                rightCount = fingerCount;
            }

            outputText += handedness + " hand: " + fingerCount + " fingers\n";
        }

        outputText += "\nOperation: " + currentOperation + "\n";
        outputText += calculate(leftCount, rightCount);
    } else {
        outputText = "No hand detected";
    }

    resultText.innerText = outputText;
    canvasCtx.restore();
});

// Configure the camera for capturing video frames
var camera = new Camera(videoElement, {
    onFrame: async function () {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Start the camera
camera.start();
