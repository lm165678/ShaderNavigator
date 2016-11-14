'use strict';

import { ShaderImporter } from './ShaderImporter.js';

/**
* A ProjectionPlane instance is a portion of a 3D plane, defined as a rectangular surface. It is subdivided in a certain amount of sub-planes that are square-shaped. Each sub-plane is the size of half a texture chunk of the current resolution level.
* Example: if a texture chunk at level 3 is of size 1/8 x 1/8 x 1/8 in world coordinates, the csub-planes will be 1/16 x 1/16.
* This ensure that we dont have to many texture (Sampler2D) to send the the fragment shader of each sub-planes because, even in critical cases, a sub-plane of this size wont intersect more than 8 texture chunks.
*
*/
class ProjectionPlane{

  /**
  * @param {Number} chunkSize - The size of a texture chunk at the current level of resolution (in world coordinates)
  *
  */
  constructor( chunkSize ){
    this._plane = new THREE.Object3D();

    this._subPlaneSize = chunkSize / 2;

    // list of subplanes
    this._subPlanes = [];

    // one shader material per sub-plane
    this._shaderMaterials = [];

    // one uniform per shader
    //this.uniforms = [];

    // number of rows and cols of sub-planes to compose the _plane
    this._subPlaneDim = {row: 10, col: 20};

    this._buildSubPlanes();

    // given by aggregation
    this._levelManager = null;

    this._resolutionLevel = 0;
  }


  /**
  * Build all the subplanes with fake textures and fake origins. The purpose is just to create a compatible data structure able to receive relevant texture data when time comes.
  */
  _buildSubPlanes(){

    var subPlaneGeometry = new THREE.PlaneBufferGeometry( this._subPlaneSize, this._subPlaneSize, 1 );

    /*
    var subPlaneMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        wireframe: true
    });
    */

    // a fake texture is a texture used instead of a real one, just because
    // we have to send something to the shader even if we dont have data
    var fakeTexture = new THREE.DataTexture(
        new Uint8Array(1),
        1,
        1,
        THREE.LuminanceFormat,  // format, luminance is for 1-band image
        THREE.UnsignedByteType  // type for our Uint8Array
      );

    var fakeOrigin = new THREE.Vector3(0, 0, 0);

    var subPlaneMaterial_original = new THREE.ShaderMaterial( {
      uniforms: {
        // the textures
        nbChunks: {
          type: "i",
          value: 0
        },
        textures: {
          type: "t",
          value: [  fakeTexture, fakeTexture, fakeTexture, fakeTexture,
                    fakeTexture, fakeTexture, fakeTexture, fakeTexture]
        },
        // the texture origins (in the same order)
        textureOrigins: {
          type: "v3v",
          value: [  fakeOrigin, fakeOrigin, fakeOrigin, fakeOrigin,
                    fakeOrigin, fakeOrigin, fakeOrigin, fakeOrigin]
        },
        chunkSize : {
          type: "f",
          value: 1
        }
      }
      ,
      vertexShader: ShaderImporter.texture3d_vert,
      fragmentShader: ShaderImporter.texture3d_frag
    });
    subPlaneMaterial_original.side = THREE.DoubleSide;
    subPlaneMaterial_original.transparent = true;


    for(var j=0; j<this._subPlaneDim.row; j++){
      for(var i=0; i<this._subPlaneDim.col; i++){

        var subPlaneMaterial = subPlaneMaterial_original.clone();

        var mesh = new THREE.Mesh( subPlaneGeometry, subPlaneMaterial );
        mesh.position.set(-this._subPlaneDim.col*this._subPlaneSize/2 + i*this._subPlaneSize + this._subPlaneSize/2, -this._subPlaneDim.row*this._subPlaneSize/2 + j*this._subPlaneSize + this._subPlaneSize/2, 0.0);

        this._plane.add( mesh );
        this._subPlanes.push( mesh );
        this._shaderMaterials.push( subPlaneMaterial );

      }
    }

  }


  /**
  * Defines the level manager so that the texture chunks can be fetched for each sub-plane.
  * @param {LevelManager} lm - the level manager
  */
  setLevelManager(lm){
    this._levelManager = lm;
  }


  /**
  * Debugging. Chanfe the color of the mesh of the plane, bit first, the plane material has to be set as a mesh.
  */
  setMeshColor(c){
    this._subPlanes[0].material.color = c;
    //this._subPlanes[0].visible = false;
  }


  /**
  * fetch each texture info, build a uniform and
  */
  updateUniforms(){
    var nbSubPlanes = this._subPlaneDim.row * this._subPlaneDim.col;
    var textureData = 0;

    let timer = 0;

    for(var i=0; i<nbSubPlanes; i++){
      // center of the sub-plane in world coordinates
      var center = this._subPlanes[i].localToWorld(new THREE.Vector3(0, 0, 0))
      var chunkSizeWC = this._levelManager.getCurrentChunkSizeWc();

      var t0 = performance.now();
      textureData = this._levelManager.get8ClosestTextureData([center.x, center.y, center.z]);

      var t1 = performance.now();
      timer += (t1 - t0);

      this.updateSubPlaneUniform(i, textureData);
    }

    timer /= nbSubPlanes;
    console.log("Time: " + timer + " milliseconds.")


    //console.log(textureData);

  }


  /**
  * Update the uniform of a specific sub-plane using the texture data. This will automatically update the related fragment shader.
  * @param {Number} i - index of the subplane to update.
  * @textureData {Object} textureData - texture data as created by LevelManager.get8ClosestTextureData()
  */
  updateSubPlaneUniform(i, textureData){
    var chunkSizeWC = this._levelManager.getCurrentChunkSizeWc();
    var uniforms = this._shaderMaterials[i].uniforms;
    uniforms.nbChunks.value = textureData.nbValid;
    uniforms.textures.value = textureData.textures;
    uniforms.textureOrigins.value = textureData.origins;
    uniforms.chunkSize.value = chunkSizeWC;
    this._shaderMaterials[i].needsUpdate = true;  // apparently useless
  }


  /**
  * @return the main plane, containing all the sub-planes
  */
  getPlane(){
    return this._plane;
  }


  /**
  * Update the internal resolution level and scale the plane accordingly.
  * @param {Number} lvl - zoom level, most likely in [0, 6] (integer)
  */
  updateScaleFromRezLvl( lvl ){
    this._resolutionLevel = lvl;
    var scale = 1 / Math.pow( 2, this._resolutionLevel );

    this._plane.scale.x = scale;
    this._plane.scale.y = scale;
    this._plane.scale.z = scale;
  }



}


export { ProjectionPlane };
