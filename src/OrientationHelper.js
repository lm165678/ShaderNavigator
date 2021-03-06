'use strict';



/**
* A OrientationHelper is a sphere surrounding the orthogonal planes that will show the direction of left/right, posterior/anterior and inferior/superior.
*
*/
class OrientationHelper{

  /**
  *
  */
  constructor( initRadius ){
    this._sphere = new THREE.Object3D();

    var xColor = 0xff3333;
    var yColor = 0x00EB4E;
    var zColor = 0x0088ff;

    this._initRadius = initRadius / 25;

    var geometryX = new THREE.CircleGeometry( this._initRadius, 64 );
    var geometryY = new THREE.CircleGeometry( this._initRadius, 64 );
    var geometryZ = new THREE.CircleGeometry( this._initRadius, 64 );
    var materialX = new THREE.LineBasicMaterial( { color: xColor, linewidth:1.5 } );
    var materialY = new THREE.LineBasicMaterial( { color: yColor, linewidth:1.5 } );
    var materialZ = new THREE.LineBasicMaterial( { color: zColor, linewidth:1.5 } );

    // remove inner vertice
    geometryX.vertices.shift();
    geometryY.vertices.shift();
    geometryZ.vertices.shift();

    // X circle
    var circleX = new THREE.Line( geometryX, materialX );
    circleX.name = "xCircle";
    geometryX.rotateY(Math.PI / 2);
    // Y circle
    var circleY = new THREE.Line( geometryY, materialY );
    circleY.name = "yCircle";
    geometryY.rotateX(-Math.PI / 2);
    // Z circle
    var circleZ = new THREE.Line( geometryZ, materialZ );
    circleZ.name = "zCircle";

    this._sphere = new THREE.Object3D();
    this._sphere.add(circleX);
    this._sphere.add(circleY);
    this._sphere.add(circleZ);

    // adding central lines
    var xLineGeometry = new THREE.Geometry();
    xLineGeometry.vertices.push(
    	new THREE.Vector3( -this._initRadius, 0, 0 ),
    	new THREE.Vector3( this._initRadius, 0, 0 )
    );

    var xLine = new THREE.Line(
      xLineGeometry,
      new THREE.LineBasicMaterial({	color: xColor, linewidth:1.5 })
    );

    var yLineGeometry = new THREE.Geometry();
    yLineGeometry.vertices.push(
    	new THREE.Vector3(0, -this._initRadius, 0 ),
    	new THREE.Vector3(0,  this._initRadius, 0 )
    );

    var yLine = new THREE.Line(
      yLineGeometry,
      new THREE.LineBasicMaterial({	color: yColor, linewidth:1.5 })
    );

    var zLineGeometry = new THREE.Geometry();
    zLineGeometry.vertices.push(
    	new THREE.Vector3(0, 0, -this._initRadius ),
    	new THREE.Vector3(0, 0,  this._initRadius )
    );

    var zLine = new THREE.Line(
      zLineGeometry,
      new THREE.LineBasicMaterial({	color: zColor, linewidth:1.5 })
    );

    this._sphere.add( xLine );
    this._sphere.add( yLine );
    this._sphere.add( zLine );


    // adding sprites with labels
    var textureLoader = new THREE.TextureLoader();
    var leftTex = textureLoader.load( "textures/left.png" );
    var rightTex = textureLoader.load( "textures/right.png" );
    var antTex = textureLoader.load( "textures/anterior.png" );
    var postTex = textureLoader.load( "textures/posterior.png" );
    var supTex = textureLoader.load( "textures/superior.png" );
    var infTex = textureLoader.load( "textures/inferior.png" );

    var leftSprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: leftTex} ) );
    var rightSprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: rightTex} ) );
    var antSprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: antTex} ) );
    var postSprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: postTex} ) );
    var supSprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: supTex} ) );
    var infSprite = new THREE.Sprite( new THREE.SpriteMaterial( { map: infTex} ) );

    var distanceFromCenter = this._initRadius * 1.4;
    
    var spriteScale = 0.5;
    leftSprite.scale.set(spriteScale, spriteScale, spriteScale);
    rightSprite.scale.set(spriteScale, spriteScale, spriteScale);
    antSprite.scale.set(spriteScale, spriteScale, spriteScale);
    postSprite.scale.set(spriteScale, spriteScale, spriteScale);
    supSprite.scale.set(spriteScale, spriteScale, spriteScale);
    infSprite.scale.set(spriteScale, spriteScale, spriteScale);
    
    leftSprite.position.set( distanceFromCenter, 0, 0 );
    rightSprite.position.set( -distanceFromCenter, 0, 0 );
    antSprite.position.set(0, distanceFromCenter, 0 );
    postSprite.position.set(0, -distanceFromCenter, 0 );
    supSprite.position.set(0, 0, -distanceFromCenter );
    infSprite.position.set(0, 0, distanceFromCenter );

    this._sphere.add(leftSprite);
    this._sphere.add(rightSprite);
    this._sphere.add(antSprite);
    this._sphere.add(postSprite);
    this._sphere.add(supSprite);
    this._sphere.add(infSprite);

    this._sphere.children.forEach( function(child){
      child.layers.enable( 0 );
      child.layers.enable( 1 );
    });

  }


  /**
  * Add the local helper mesh to obj.
  * @param {THREE.Object3D} obj - container object to add the local helper.
  */
  addTo( obj ){
    obj.add( this._sphere );
  }


  /**
  * Rescale the helper with a given factor.
  * @param {Number} f - a scaling factor, most likely within [0, 1]
  */
  rescale( f ){
    this._sphere.scale.x = f;
    this._sphere.scale.y = f;
    this._sphere.scale.z = f;
  }


  /**
  * Resize the helper depending on the resolution level
  */
  rescaleFromResolutionLvl( lvl ){
    var scale = 1 / Math.pow( 2, lvl );
    this._sphere.scale.x = scale;
    this._sphere.scale.y = scale;
    this._sphere.scale.z = scale;
  }

  /**
  * Set the position of the orientation helper.
  * @param {THREE.Vector3} vPos - The position as a vector to clone.
  */
  setPosition( vPos ){
    this._sphere.position.x = vPos.x;
    this._sphere.position.y = vPos.y;
    this._sphere.position.z = vPos.z;
  }

  /**
  * Show the helper if hidden, hide it if shown.
  */
  toggle(){
    this._sphere.visible = !this._sphere.visible;
  }


  /**
  * Set the visibility of the orientation Helpers
  * @param {Boolean} b - true to show, false to hide
  */
  setVisibility( b ){
    this._sphere.visible = b;
  }


  /**
  * @return {Number} the actual radius of orientation helper, considering the ajustment to
  * resolution level.
  */
  getRadius(){
    return (this._initRadius * this._sphere.scale.x);
  }


} /* END class OrientationHelper */


export { OrientationHelper };
