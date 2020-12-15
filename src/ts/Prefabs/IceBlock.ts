/* 
 * copyright 2020, Justin Reardon.
*/

export default class IceBlock extends Phaser.Physics.Matter.Sprite {
  constructor(world: Phaser.Physics.Matter.World, x: number, y: number) {
    const width = 16;
    const height = 16;
    super(world, x, y, 'iceblock', 0, {
      chamfer: { radius: 4 },
      isStatic: true,
      friction: 0.001,
      restitution: 0
    });

    world.scene.add.existing(this);
    this.setFixedRotation();
    this.setIgnoreGravity(true);
    this.setCollisionCategory(1);
    this.setCollisionGroup(0);
    this.setDisplaySize(16, 16)
  }
}