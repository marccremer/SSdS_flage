# Konzept
Ich wollte ein System von Federn erstellen mit dem Ich Stoff simulieren könnte.

## Processing
Als erstes habe ich eine Repository für unser Team erstellt mit Processing und automatischen Reload beim speichern.

Ich habe am auch mit GPU Beschleunigung rum gespielt, aber schnell gesehen das das viel arbeit für wenig Lohn war.
Der Einfachheit halber hatte Ich mich entschieden erstmal zu versuchen eine Simulation in 2D zu erstellen, bevor ich mich mit 3D versuche
## Physis & Springs

Ich habe die Entwicklung mit dem Physik System angefangen, wobei Ich auch eine _Particle_  Klasse erstellt hatte. Die Klasse sollte sämtliches Verhalten abbilden und Ich hatte daher ein Komponenten System dafür entwickelt, wobei einzelne Komponenten unterschiedliche Daten wie Geschwindigkeit und Masse enthalten sollten.

```js
export class Particle {
  components: [PositionComponent, MovementComponent, GravityComponent];
  constructor(position: Vec2d, mass: number) {
    this.components = [
      { name: "position", pos: position },
      { name: "movement", accelaration: [0, 0], velocity: [0, 0] },
      { gravityConstant: 1.1, mass, name: "gravity" },
    ];
  }
}
```

Nachdem Schwerkraft funktionierte, habe ich angefangen Federn nach Hook's Gesetzt zu implementieren.

```js
let force = subVec2d(spring.springAnchor.pos, pos);
let { magnitude: extensionLength, result: extensionDirection } =
  normalizeVec2d(force);
// Calculate the extension amount (distance from rest length)
let x =
  spring.restLength < extensionLength
	? extensionLength - spring.restLength
	: 0;
// Calculate the spring force based on Hooke's Law: F = -k * x
const springForce = scaleVec2d(
  extensionDirection,
  -1 * spring.springConstant * x * deltaTime
);
```

Das funktionierte auch für eine Feder, als Ich aber versuchte die mehrere Federn miteinander zu kombinieren, wurde die Simulation sehr instabil und neige zum "explodieren".
Ich habe hier so lange mit Dämpfung und 
## Generierung von Kleidung
Als das System einigermaßen lief wollte ich die Generierung der Flagge ein bisschen dynamischer und einfacher zu debuggen machen.

Die Flagge sollte ein Grid sein und wenn ein Punkt in der 1. Reihe ist sollte er einen unbewegbaren Anker haben.
```js
/// for row and coloumn
const particlePositionCmp: PositionComponent = generateRandomPosition();
const springPartners: PositionComponent[] = [];
if (row == 0 && col === SHIRT_WIDTH - 1) {
  springPartners.push(flagAnchor1);
}
if (row > 0) {
  const aboveIndex = (row - 1) * SHIRT_WIDTH + col;
  const aboveParticle = particles[aboveIndex];
  const abovePosition = aboveParticle.components[0] as PositionComponent;
  springPartners.push(abovePosition);
  const springCmp = aboveParticle.getComponent('spring');
  springCmp.springPartner.push(particlePositionCmp);
}
const p = new Particle(poscomp, Math.random() * 20, {
if (col > 0) {
  const leftIndex = row * SHIRT_WIDTH + (col - 1);
  const leftParticle = particles[leftIndex];
  const leftPosition = leftParticle.components[0] as PositionComponent;
  springPartners.push(leftPosition);
  const springCmp = leftParticle.getComponent('spring');
  springCmp.springPartner.push(particlePositionCmp);
}
if (row === 0 && col === 0) {
  springPartners.push(flagAnchor2);
}
...
```


## Maus
Zum testen und zur Visualisierung hatte ich danach den Nutzer ermöglicht einzelne Punkte zu "ziehen". Hierbei habe ich einfach den nächsten Punkt zur Maus genommen und seine Position auf die Position der Maus gesetzt.
Der verschobene Punkt hat dann den Rest der Flagge hinterher gezogen.
Außerdem hatte Ich zum Spaß noch eine Aufnahme Funktionalität eingebaut.

## Texturen
Den Grid von Punkten in eine richtige Flagge umzuwandeln war relative simple.
Ich habe mir eine schöne Flagge online ausgesucht und mit _p5.js_ geladen.
Danach habe ich in einer Schleife mir immer 4 Punkte genommen, über Sie ein Vertex gebildet und eine Textur auf sie gemalt.
Kompliziert war hier das Mappen von Pixel auf Datenpunkte im Grid.

```js
  // Get the four corners of each cell
  let topLeft = points[row * gridWidth + col];
  let topRight = points[row * gridWidth + col + 1];
  let bottomLeft = points[(row + 1) * gridWidth + col];
  let bottomRight = points[(row + 1) * gridWidth + col + 1];
  // Map texture coordinates (u, v) to grid coordinates
  let u1 = (col / gridWidth) * img.width;
  let v1 = (row / gridHeight) * img.height;
  let u2 = ((col + 1) / gridWidth) * img.width;
  let v2 = ((row + 1) / gridHeight) * img.height;
  // Draw the cell as a textured quadrilateral
  instance.beginShape();
  instance.texture(img);
  instance.vertex(topLeft[0], topLeft[1], u1, v1);
  instance.vertex(topRight[0], topRight[1], u2, v1);
  instance.vertex(bottomRight[0], bottomRight[1], u2, v2);
  instance.vertex(bottomLeft[0], bottomLeft[1], u1, v2);
```


## Wind
Ich hatte Wind erstmal naive als _Schwerkraft von links_ implementiert. Das sah nicht sehr realistisch aus 