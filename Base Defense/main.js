//The title of the game to be displayed on the title screen
title = "BASE DEFENSE";

//The description, which is also displayed on the title screen
description =
`  MOUSE TO MOVE 
  CLICK TO SHOOT
`
;

//The array of custom sprites
characters = [
`
  ll
  ll
ccllcc
ccllcc
ccllcc
cc  cc
`,`
rr  rr
rrrrrr
rrpprr
rrrrrr
  rr
  rr
`,`
cc  cc
ccllcc
ccllcc
ccllcc
  ll
  ll
`,`
y  y
yyyyyy
 y  y
yyyyyy
 y  y
`
];

//Game runtime options
//Refer to the official documentation for all available options
const G = {
	WIDTH: 100,
	HEIGHT: 150,

	STAR_SPEED_MIN: 0.5,
	STAR_SPEED_MAX: 1.0,

	PLAYER_FIRE_RATE: 4,
	PLAYER_GUN_OFFSET: 3,

	FBULLET_SPEED: 5,

	ENEMY_MIN_BASE_SPEED: 1.0,
	ENEMY_MAX_BASE_SPEED: 2.0,
	ENEMY_FIRE_RATE: 50,

	FRIENDLY_MIN_BASE_SPEED: 1.0,
	FRIENDLY_MAX_BASE_SPEED: 2.0,

	EBULLET_SPEED: 1.0,
	EBULLET_ROTATION_SPD: 0.1
};
options = {
	theme: "pixel",
	viewSize : {x: G.WIDTH, y: G.HEIGHT}
};

/**
 * @typedef {{
 * pos: Vector,
 * speed: number
 * }} Star
 */

/**
 * @type { Star []}
 */
let stars;

/**
 * @typedef {{
 * pos: Vector,
 * firingCooldown: number,
 * isFiringLeft: boolean
 * }} Player
 */

/**
 * @type { Player }
 */
let player;

/**
 * @typedef {{
 * pos: Vector
 * }} FBullet
 */

/**
 * @type { FBullet []}
 */
let fBullets;

/**
 * @typedef {{
 * pos: Vector,
 * firingCooldown: number
 * }} Enemy
 */

/**
 * @type { Enemy []}
 */
let enemies;

/**
 * @typedef {{
 * pos: Vector,
 * angle: number,
 * rotation: number
 * }} EBullet
 */

/**
 * @type { EBullet [] }
 */
let eBullets;

/**
 * @typedef {{
 * pos: Vector
 * }} Friendly
 */

/**
 * @type { Friendly []}
 */
let friendly;

/**
 * @type { number }
 */
let currentEnemySpeed;

/**
 * @type { number }
 */
 let currentFriendlySpeed;

/**
 * @type { number }
 */
let waveCount;

//The game loop function
function update() {
	//The init function
	if (!ticks) {
		stars = times(20, () => {
			const posX = rnd(0, G.WIDTH);
			const posY = rnd(0, G.HEIGHT);
			return {
				pos: vec(posX, posY),
				speed: rnd(G.STAR_SPEED_MIN, G.STAR_SPEED_MAX)
			};
		});	
		player = {
			pos: vec(G.WIDTH * 0.5, G.HEIGHT * 0.5),
			firingCooldown: G.PLAYER_FIRE_RATE,
			isFiringLeft: true
		};
		fBullets = [];
		enemies = [];
		friendly = [];
		eBullets = [];
		waveCount = 0;
		currentEnemySpeed = 0;
		currentFriendlySpeed = 0;
	}
	
	if(enemies.length == 0){
		currentEnemySpeed = 
			rnd(G.ENEMY_MIN_BASE_SPEED, G.ENEMY_MAX_BASE_SPEED) * difficulty;
		for(let i = 0; i < 4; i++){
			const posX = rnd(0, G.WIDTH);
			const posY = -rnd(i * G.HEIGHT * 0.1);
			enemies.push({ 
				pos: vec(posX, posY),
				firingCooldown: G.ENEMY_FIRE_RATE
			});
		}
		waveCount++;
	}
	///////////
	if(friendly.length == 0){
		currentFriendlySpeed = 
			rnd(G.FRIENDLY_MIN_BASE_SPEED, G.FRIENDLY_MAX_BASE_SPEED);
		for(let i = 0; i < 2; i++){
			const posX = rnd(0, G.WIDTH);
			const posY = -rnd(i * G.HEIGHT * 0.1);
			friendly.push({ pos: vec(posX, posY)})
		}
	}
	player.pos = vec(input.pos.x, input.pos.y);
	//player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);
	player.pos.clamp(3, 97, 125, 10);
	player.firingCooldown--;

	if(input.isPressed){
		if(player.firingCooldown <= 0){
			const offset = (player.isFiringLeft)
				? -G.PLAYER_GUN_OFFSET
				: G.PLAYER_GUN_OFFSET;
			fBullets.push({
				pos: vec(player.pos.x + offset, player.pos.y)
			});
			player.firingCooldown = G.PLAYER_FIRE_RATE;
			player.isFiringLeft = !player.isFiringLeft;
			color("black");
			particle(
				player.pos.x + offset,	//x coordinate
				player.pos.y,	//y coordinate
				4, //number of particles
				1, //speed of particles
				-PI/2, //emitting angle
				PI/4   //emitting width
			);
		}
	}
	color("black");
	//box(player.pos, 4);
	char("a", player.pos);
	fBullets.forEach((fb) => {
		fb.pos.y -= G.FBULLET_SPEED;
		color("black");
		box(fb.pos, 2);
	});

	remove(enemies, (e) => {
		e.pos.y += currentEnemySpeed;
		e.firingCooldown--;
		if(e.firingCooldown <= 0) {
			eBullets.push({
				pos: vec(e.pos.x, e.pos.y),
				angle: e.pos.angleTo(player.pos),
				rotation: rnd()
			});
			e.firingCooldown = G.ENEMY_FIRE_RATE;
			play("select");
		}
		color("black");
		const isCollidingWithFBullets = char("b", e.pos).isColliding.rect.black;
		if(isCollidingWithFBullets){
			color("black");
			particle(e.pos);
			play("explosion");
			addScore(10, e.pos);
		}
		return(isCollidingWithFBullets || e.pos.y > G.HEIGHT);
	});
	
	remove(eBullets, (eb) => {
		eb.pos.x += G.EBULLET_SPEED * Math.cos(eb.angle);
		eb.pos.y += G.EBULLET_SPEED * Math.sin(eb.angle);
		eb.rotation += G.EBULLET_ROTATION_SPD;
		color("red");
		const isCollidingWithPlayer 
			= char("c", eb.pos, {rotation: eb.rotation}).isColliding.char.a;
		if(isCollidingWithPlayer){
			end();
			play("powerUp");
		}
		return(!eb.pos.isInRect(0, 0, G.WIDTH, G.HEIGHT));
	});

	remove(friendly, (e) => {
		e.pos.y += currentFriendlySpeed;
		color("black");
		const isCollidingWithFBullets = char("c", e.pos).isColliding.rect.black;
		if(isCollidingWithFBullets){
			color("black");
			particle(e.pos);
			play("laser");
			addScore(-5, e.pos);
		}
		
		return(isCollidingWithFBullets || e.pos.y > G.HEIGHT);
	})

	remove(fBullets, (fb) => {
		color("black");
		const isCollidingWithEnemies = box(fb.pos, 2).isColliding.char.b;
		return (isCollidingWithEnemies || fb.pos.y < 0);
	});

	if(score < 0){
		end();
		play("powerUp");
	}


	stars.forEach((s) => {
		s.pos.y += s.speed;
		s.pos.wrap(0, G.WIDTH, 0, G.HEIGHT);
		color("light_blue");
		box(s.pos, 1);
	});
	
}
