//TIPS:when run this,just point [mouse left button],then wait for a coupe of seconds.it will run(sort of)
let lines = [];
let totalLines = 140;
let smoothActivity = 0;

let video;
let facemesh;
let predictions = [];

let sounds = [];
let soundFiles = [
  "sound1.m4a",
  "sound2.m4a",
  "sound3.m4a",
  "sound4.m4a",
  "sound5.m4a",
  "sound6.m4a",
  "sound7.m4a",
  "sound8.m4a",
  "sound9.m4a",
  "sound10.m4a",
  "sound11.m4a",
];

let started = false;

function preload() {
  for (let i = 0; i < soundFiles.length; i++) {
    sounds[i] = loadSound(soundFiles[i]);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);

  video = createCapture(VIDEO);
  video.size(320, 240);
  video.hide();

  facemesh = ml5.faceMesh(video, modelLoaded);

  // draw the point formed lines
  for (let i = 0; i < totalLines; i++) {
    let vertical = random() > 0.5;
    let dotSpacing = random(22, 30);
    let maxDots = vertical
      ? floor(height / dotSpacing)
      : floor(width / dotSpacing);

      // these lines will appear in different direction(vertical/horizonal,left/right,up/down)
    lines.push({
      vertical,
      basePos: vertical ? random(width) : random(height),
      dotSpacing,
      maxDots,
      progress: 0,
      speedFactor: random(0.6, 1.6),//random speed
      direction: random() > 0.5 ? 1 : -1,
      col: color(random(360), 90, 100),//colorful color represent different metro
      exploding: false,
      explodeFrame: 0,
    });
  }
}

function modelLoaded() {
  console.log("FaceMesh ready");///https://docs.ml5js.org/#/reference/facemesh///
  facemesh.detectStart(video, gotFaces);
}

function gotFaces(results) {
  predictions = results;
}



function mousePressed() {
  if (!started) {
    userStartAudio();
    for (let s of sounds) {
      s.setLoop(true);
      s.play();
      s.setVolume(0);
    }
    started = true;
  }
}

function draw() {
  console.log(predictions.length);
  background(0, 25);
  blendMode(ADD);

  let activity = 0;
  let faceSize = 0;

  //***KEY***the way to define the distance of the face is face size
  if (predictions.length > 0) {
    let keypoints = predictions[0].keypoints;

    let minX = video.width;
    let maxX = 0;
    let minY = video.height;
    let maxY = 0;

 // Find the bounding box of the face using all keypoints
    for (let i = 0; i < keypoints.length; i++) {
      let x = keypoints[i].x;
      let y = keypoints[i].y;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    let faceWidth = maxX - minX;
    let faceHeight = maxY - minY;

    // Face area as a proxy for physical proximity
    faceSize = faceWidth * faceHeight;

    activity = map(faceSize, 2000, 35000, 0, 1);///-<---the smaller face size the further,the larger face size the closer
    activity = constrain(activity, 0, 1);
  }

  smoothActivity = lerp(smoothActivity, activity, 0.08);

  //// ***KEY***---the closer your head approach,the more amount of colorful Point formed Line it will show
  ////the brighter the line will show&&the faster the line will move
  let activeCount = 0;

  if (smoothActivity < 0.15) {
    activeCount = 0;
  } else if (smoothActivity < 0.3) {
    activeCount = totalLines * 0.35;
  } else if (smoothActivity < 0.5) {
    activeCount = totalLines * 0.55;
  } else if (smoothActivity < 0.7) {
    activeCount = totalLines * 0.75;
  } else {
    activeCount = totalLines;
  }

  let baseSpeed = pow(smoothActivity, 2.2) * 1.2;

  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];

    if (i < activeCount) {
      if (!l.exploding) {
        l.progress += baseSpeed * l.speedFactor;
      }
    } else {
      l.progress -= 6;
      if (l.progress < 0) {
        l.progress = 0;
        l.exploding = false;
      }
    }

    let currentLength = floor(l.progress);


    // When a line reaches full length,
    // it briefly flashes at maximum brightness.
    if (l.exploding) {
      stroke(hue(l.col), 90, 100, 100);
      strokeWeight(4);
      noFill();

      for (let d = 0; d < l.maxDots; d++) {
        drawDot(l, d, 14);
      }

      l.explodeFrame++;
      if (l.explodeFrame > 3) {
        l.exploding = false;
        l.progress = 0;
      }
      continue;
    }

    for (let d = 0; d < currentLength; d++) {
      if (d < l.maxDots) {
        let alpha = map(d, 0, l.maxDots, 20, 100); // Alpha increases along the line,creating a fading trail effect
        stroke(hue(l.col), 90, 100, alpha);
        strokeWeight(3);

        let dotSize = 10 + smoothActivity * 6;
        drawDot(l, d, dotSize);
      }
    }

    if (i < activeCount && l.progress >= l.maxDots) {
      l.exploding = true;
      l.explodeFrame = 0;
    }
  }

  blendMode(BLEND);

  // ***KEY***---the closer your head approach,the more sound(multiple train souonds) it will show
  if (started) {
    let activeSoundCount = 0;

    if (smoothActivity < 0.1) {
      activeSoundCount = 1;
    } else if (smoothActivity < 0.2) {
      activeSoundCount = 3;
    } else if (smoothActivity < 0.3) {
      activeSoundCount = 4;
    } else if (smoothActivity < 0.5) {
      activeSoundCount = 5;
    } else if (smoothActivity < 0.7) {
      activeSoundCount = 7;
    } else {
      activeSoundCount = sounds.length;
    }

    let masterVolume = pow(smoothActivity, 2.0);

    for (let i = 0; i < sounds.length; i++) {
      if (i < activeSoundCount) {
        sounds[i].setVolume(masterVolume * 0.6, 0.2);
      } else {
        sounds[i].setVolume(0, 0.5);
      }
    }
  }
}

function drawDot(line, index, size) {
  let posIndex =
    line.direction > 0 ? index : line.maxDots - index;

  let x, y;

  if (line.vertical) {
    x = line.basePos;
    y = posIndex * line.dotSpacing;
  } else {
    x = posIndex * line.dotSpacing;
    y = line.basePos;
  }

  noFill();
  ellipse(x, y, size, size);

  noStroke();
  fill(0, 0, 100);
  ellipse(x, y, size * 0.4, size * 0.4);
}
