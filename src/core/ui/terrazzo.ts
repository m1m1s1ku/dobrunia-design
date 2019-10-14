interface Point {
  angle: number;
  multiplicator: number;
  x: number;
  y: number;
}

function randomValue(min: number, max: number){
  return Math.floor(min + Math.random()*(max + 1 - min));
}

function generate(colors: string[], canvas: HTMLCanvasElement, debug: boolean) {
  let radius = 20;
  let center = [canvas.width/2,canvas.height];

  const ctx = canvas.getContext('2d');
  center = [
      randomValue(canvas.width * 0.05, canvas.width * 0.95),
      randomValue(canvas.height * 0.05, canvas.height * 0.95)
  ];
  radius = randomValue(5,40);

const totalPoints = randomValue(3,8);
const points = [];
let multiplicator: number;
let angle: number; 
let currentPoint: Point; 

let prevPoint: Point;
let middlePoint: number;

const rotation = Math.PI * Math.random();

// GENERATE POINTS
for (let i = 0; i < totalPoints; i++) {
  multiplicator = randomValue(80,120) / 100;
  angle = Math.PI * 2 * (i/totalPoints) + (i/totalPoints) * (randomValue(-33,33)/100) + rotation;

  points.push({
    angle: angle,
    x: center[0] + radius * Math.cos(angle * -1) + randomValue(radius*-0.3, radius*0.3),
    y: center[1] + radius * Math.sin(angle) + randomValue(radius*-0.3, radius*0.3),
    multiplicator: multiplicator
  });
}

points.sort(function(a,b) { return a.angle - b.angle;});


// BASE CIRCLE

if (debug) {
  ctx.beginPath();
  ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
  ctx.stroke();
}

ctx.beginPath();

for (let i = 0; i < points.length; i++) {
  currentPoint = points[i];

  if (i === 0) {
    ctx.moveTo(
      center[0] + radius * Math.cos(currentPoint.angle * -1),
      center[1] + radius * Math.sin(currentPoint.angle)
    );
  } else {
    prevPoint = points[i - 1];
    middlePoint = ((currentPoint.angle - prevPoint.angle) / 2) + prevPoint.angle;

    ctx.quadraticCurveTo(
      center[0] + radius * Math.cos(middlePoint * -1) * currentPoint.multiplicator,
      center[1] + radius * Math.sin(middlePoint) * currentPoint.multiplicator,
      currentPoint.x,
      currentPoint.y
    );
  }
}
ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
ctx.fill();



if (debug) {
  // POINTS DE BASE
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    ctx.beginPath();
    ctx.fillStyle = '#FF0000';
    ctx.arc(
      points[i].x,
      points[i].y,
      5,
      0,
      2 * Math.PI
      );
      ctx.fill();
  }

  // POINTS DE COURBE
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {

    if (i > 0) {
      currentPoint = points[i];
      prevPoint = points[i - 1];
      middlePoint = ((currentPoint.angle - prevPoint.angle) / 2) + prevPoint.angle;

      ctx.beginPath();
      ctx.fillStyle = '#0000FF';
      ctx.arc(
        center[0] + radius * Math.cos(middlePoint * -1) * currentPoint.multiplicator,
        center[1] + radius * Math.sin(middlePoint) * currentPoint.multiplicator,
        4,
        0,
        2 * Math.PI
        );
      ctx.fill();
    }
  }
}
}

export default function terrazzo(host: Element, colors: string[], isResize = false, debug = false){
  const canvas = host.shadowRoot ? host.shadowRoot.querySelector('canvas') : host.querySelector('canvas');
  const height = document.body.scrollHeight;

  canvas.width = window.innerWidth;
  canvas.height = isResize ? canvas.height : height;

  const nb = randomValue(20,100);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let drawn = 0;
  const animate = () => {
    const timeHandle = setTimeout(() => {
      const handle = requestAnimationFrame(animate);
      generate(colors, canvas, debug);
      drawn++;
      if(drawn > nb){
        cancelAnimationFrame(handle);
        clearTimeout(timeHandle);
        return;
      }
    }, 1000 / 60);
  };
  
  animate();
}
