'use strict'

class GuiController{

  constructor( quadScene ){

    this._quadScene = quadScene;

    // fake value for dat gui - just to display the init value
    this._resolutionLevel = this._quadScene.getResolutionLevel();
    this._resolutionLvlRange = [0, 6];
    this._resolutionLvlSliderBuilt = false;
    this._resolutionDescription = '';

    // special controller for colormaps
    this._colormapManager = this._quadScene.getColormapManager();
    this._colormapManager.onColormapUpdate( this._updateColormapList.bind(this) );

    // Annotations
    this._annotationCollection = this._quadScene.getAnnotationCollection();

    // to specify shift+click on the ortho cam plane projections
    this._quadViewInteraction = this._quadScene.getQuadViewInteraction();

    // the plane manager
    this._planeManager = this._quadScene.getPlaneManager();

    var panelWidth = 200;
    var panelSpace = 5;

    this._mainPanel = QuickSettings.create(panelSpace, 0, document.title);
    this._initMainPanel();

    this._axisInfo = null;
    //this._annotationPanel = QuickSettings.create(panelWidth + panelSpace*2 , 0, "Annotations");
    //this._initAnnotationPanel();
    //this._initAnnotationPanelCallback();
  }


  /**
  * [PRIVATE]
  * Adds buttons to the widget
  */
  _initMainPanel(){
    var that = this;

    // compass toggle
    this._mainPanel.addBoolean("Compass", 1, function(mustShow){
      that._quadScene.getOrientationHelper().setVisibility( mustShow );
    });

    // bounding box toggle
    this._mainPanel.addBoolean("Bounding box", 1, function(mustShow){
      that._quadScene.getBoundingBoxHelper().setVisibility( mustShow );
    });
    document.getElementById("Bounding box").parentElement.parentElement.style["margin-top"] = "0px";

    // Lo-rez plane view toggle
    this._mainPanel.addBoolean("Lo-res projection", 1, function(mustShow){
      if(mustShow){
        that._planeManager.disableLayerHiRez(1);
        that._planeManager.showLowRezPlane();
      }else{
        that._planeManager.enableLayerHiRez(1);
        that._planeManager.hideLowRezPlane();
      }

    });
    document.getElementById("Lo-res projection").parentElement.parentElement.style["margin-top"] = "0px";

    // rez lvl slider
    this._mainPanel.addRange("Zoom level", 0, 6, 0, 1,
      // on change
      function( value ){
        value = Math.floor( value );
        that._updateResolutionDescription(
          value,
          that._quadScene.getLevelManager().getLevelInfo(that._resolutionLevel, "key") + " ➤ "
        );
      },
      // on finish
      function( value ){
        value = Math.floor( value );
        that._resolutionLevel = value;
        that._quadScene.setResolutionLevel( value );

      }
    );

    // resolution info
    this._mainPanel.addText("Resolution", "");
    this._mainPanel.overrideStyle("Resolution", "background-color", "transparent");
    document.getElementById('Resolution').readOnly = true;
    document.getElementById("Resolution").parentElement.style["margin-top"] = "0px";

    // multiplane position (unit x, y, z)
    this._mainPanel.addText("Position", "", function(){} );
    this._mainPanel.overrideStyle("Position", "text-align", "center");
    // when pressing ENTER on this field
    document.getElementById("Position").addEventListener("keypress", function( e ){
      if (e.keyCode == 13) {
        var newPosition = that._mainPanel.getValue("Position")
          .split(',')
          .map(function(elem){return parseFloat(elem)});

        that._quadScene.setMultiplanePosition(newPosition[0], newPosition[1], newPosition[2]);
      }
    });

    // mutiplane position voxel (to match A3D slices index)
    this._mainPanel.addText("Position voxel", "", function(){} );
    this._mainPanel.overrideStyle("Position voxel", "text-align", "center");
    document.getElementById("Position voxel").parentElement.style["margin-top"] = "0px";
    // on pressing ENTER on this field
    document.getElementById("Position voxel").addEventListener("keypress", function( e ){
      if (e.keyCode == 13) {
        var axisInfo = that._axisInfo;

        var newPositionVoxel = that._mainPanel.getValue("Position voxel")
          .split(',')
          .map(function(elem){return parseFloat(elem)});

        var positionUnitX = newPositionVoxel[0] / axisInfo.x.originalSize
        if(axisInfo.x.reversed){
          positionUnitX = 1 - positionUnitX;
        }
        positionUnitX = positionUnitX * (axisInfo.x.originalSize / axisInfo.x.finalSize) + (axisInfo.x.offset / axisInfo.x.finalSize)

        var positionUnitY = newPositionVoxel[1] / axisInfo.y.originalSize
        if(axisInfo.y.reversed){
          positionUnitY = 1 - positionUnitY;
        }
        positionUnitY = positionUnitY * (axisInfo.y.originalSize / axisInfo.y.finalSize) + (axisInfo.y.offset / axisInfo.y.finalSize)

        var positionUnitZ = newPositionVoxel[2] / axisInfo.z.originalSize
        if(axisInfo.z.reversed){
          positionUnitZ = 1 - positionUnitZ;
        }
        positionUnitZ = positionUnitZ * (axisInfo.z.originalSize / axisInfo.z.finalSize) + (axisInfo.z.offset / axisInfo.z.finalSize)

        that._quadScene.setMultiplanePosition(positionUnitX, positionUnitY, positionUnitZ);
      }
    });


    // multiplane rotation
    this._mainPanel.addText("Rotation", "", function(){} );
    this._mainPanel.overrideStyle("Rotation", "margin-top", "0px");
    this._mainPanel.overrideStyle("Rotation", "text-align", "center");
    document.getElementById("Rotation").parentElement.style["margin-top"] = "0px";

    // when pressing ENTER on this field
    document.getElementById("Rotation").addEventListener("keypress", function( e ){
      if (e.keyCode == 13) {
        var newRotation = that._mainPanel.getValue("Rotation")
          .split(',')
          .map(function(elem){return parseFloat(elem)});

        that._quadScene.setMultiplaneRotation(newRotation[0], newRotation[1], newRotation[2]);
      }
    });

    // Button reset rotation
    this._mainPanel.addButton("Reset rotation", function(){
      that._quadScene.setMultiplaneRotation(0, 0, 0);

    });
    this._mainPanel.overrideStyle("Reset rotation", "width", "100%");
    document.getElementById("Reset rotation").parentElement.style["margin-top"] = "0px";

  }


  /**
  * [PRIVATE]
  * Action to toggle the rotation helper
  */
  _toggleOrientationHelper(){
    this._quadScene.getOrientationHelper().toggle();
  }


  /**
  * [PRIVATE]
  * Action to toggle the bounding box helper
  */
  _toggleBoundingBoxHelper(){
    this._quadScene.getBoundingBoxHelper().toggle();
  }


  /**
  * Update the UI with a new resolution level.
  * This does not do anything but refreshing the display
  * (iow. calling this method does NOT change the rez lvl)
  */
  updateResolutionLevelUI( lvl ){
    this._resolutionLevel = lvl;
    this._mainPanel.setValue("Zoom level", lvl);
    this._updateResolutionDescription( this._resolutionLevel );
  }


  /**
  * Update the UI from rotation, position and rez lvl (later is not used here)
  * @param {Object} spaceConfig - { resolutionLvl: Number, position:[x, y, z], rotation:[x, y, z]}
  */
  updateMultiplaneUI( spaceConfig ){
    var positionString = spaceConfig.position.x.toFixed(4) + ' , ';
    positionString += spaceConfig.position.y.toFixed(4) + ' , ';
    positionString += spaceConfig.position.z.toFixed(4)
    this._mainPanel.setValue("Position", positionString);

    var rotationString = spaceConfig.rotation.x.toFixed(4) + ' , ';
    rotationString += spaceConfig.rotation.y.toFixed(4) + ' , ';
    rotationString += spaceConfig.rotation.z.toFixed(4)
    this._mainPanel.setValue("Rotation", rotationString);


    var axisInfo = spaceConfig.axisInfo;
    this._axisInfo = axisInfo; // so that we could reuse it later

    var posVoxelX = ( spaceConfig.position.x - (axisInfo.x.offset / axisInfo.x.finalSize) ) / (axisInfo.x.originalSize / axisInfo.x.finalSize)
    if(axisInfo.x.reversed){
      posVoxelX = 1 - posVoxelX;
    }

    var posVoxelY = ( spaceConfig.position.y - (axisInfo.y.offset / axisInfo.y.finalSize) ) / (axisInfo.y.originalSize / axisInfo.y.finalSize)
    if(axisInfo.y.reversed){
      posVoxelY = 1 - posVoxelY;
    }

    var posVoxelZ = ( spaceConfig.position.z - (axisInfo.z.offset / axisInfo.z.finalSize) ) / (axisInfo.z.originalSize / axisInfo.z.finalSize)
    if(axisInfo.z.reversed){
      posVoxelZ = 1 - posVoxelZ;
    }

    posVoxelX *= axisInfo.x.originalSize;
    posVoxelY *= axisInfo.y.originalSize;
    posVoxelZ *= axisInfo.z.originalSize;

    var positionVoxelString = Math.round(posVoxelX) + ' , ';
    positionVoxelString += Math.round(posVoxelY) + ' , ';
    positionVoxelString += Math.round(posVoxelZ)
    this._mainPanel.setValue("Position voxel", positionVoxelString);

// ----------------- reverse ----------
  /*
    positionVoxelX = positionVoxelX / axisInfo.x.originalSize
    if(axisInfo.x.reversed){
      positionVoxelX = 1 - posVoxelX;
    }
    positionVoxelX * (axisInfo.x.originalSize / axisInfo.x.finalSize) + (axisInfo.x.offset / axisInfo.x.finalSize)
    */
  }


  /**
  * [PRIVATE]
  * update the description of resolution level
  */
  _updateResolutionDescription( lvl, prefix="" ){
    this._resolutionDescription = prefix + this._quadScene.getLevelManager().getLevelInfo(lvl, "key");
    this._mainPanel.setValue("Resolution", this._resolutionDescription);

  }


  /**
  * [PRIVATE] callback
  * Update the colormap list box and the dedicated callback for when the colormap
  * changes.
  */
  _updateColormapList(){
    var that = this;

    // color map
    this._mainPanel.addDropDown("Colormap", this._colormapManager.getAvailableColormaps(),
      function( dropdownObj ){
        that._colormapManager.useColormap(dropdownObj.value);
        that._quadScene.refreshUniforms();
      }
    );

  }


  /**
  * [PRIVATE]
  * Create the pannel dedicated to annotaion management
  */
  _initAnnotationPanel(){
    var that = this;



    // open file button
    this._annotationPanel.addFileChooser(
      "Annotation file",
      "Open",
      "",
      function( file ){
        that._annotationCollection.loadAnnotationFileDialog( file );
      }
    );

    // save annot button
    this._annotationPanel.addButton("Export annotations", null);
    this._annotationPanel.overrideStyle("Export annotations", "width", "100%");
    document.getElementById("Export annotations").parentElement.style["margin-top"] = "0px";

    // dropdown menu
    this._annotationPanel.addDropDown("Annotations", [],
      function( dropdownObj ){
        var annotation = that._annotationCollection.getAnnotation( dropdownObj.value );

        if(annotation){
          that._displayAnnotInfo( annotation );
        }
      }
    );



    // callback when a new annot is added in the core, a new item shows on the menu
    that._annotationCollection.onAddingAnnotation( function(name){
      var dropdownObj = that._annotationPanel.getControl("Annotations");
      dropdownObj.addItem(name);
      console.log( dropdownObj );

      //dropdownObj.setValue(name);

      var annotation = that._annotationCollection.getAnnotation( name );

      if(annotation){
        that._displayAnnotInfo( annotation );
      }
    })

    /*
    this._annotationPanel.getControl("Annotations").removeItem("pouet2");
    */

    // editable field for annotation name
    this._annotationPanel.addText("Annotation name", "", function(){} );
    this._annotationPanel.overrideStyle("Annotation name", "text-align", "center");

    // editable description of the annot
    this._annotationPanel.addTextArea("Annotation description", "", function(){} );
    document.getElementById("Annotation description").parentElement.style["margin-top"] = "0px";

    // Pannel of buttons for dealing with existing annot
    this._annotationPanel.addHTML("panelEditExistingAnnot", this._buildPanelEditExistingAnnot());
    document.getElementById("panelEditExistingAnnot").parentElement.style["margin-top"] = "0px";


    // Button to create a new annotation
    this._annotationPanel.addButton("Start new annotation", function(){
      // show and hide the relevant componants
      that._annotationPanel.hideControl("panelEditExistingAnnot");
      that._annotationPanel.showControl("panelCreateAnnot");
      that._annotationPanel.showControl("Validate annotation");
      that._annotationPanel.hideControl("Start new annotation");

      // prevent the user from doing stupid interactions
      that._annotationPanel.disableControl("Annotations");
      that._annotationPanel.disableControl("Export annotations");
      that._annotationPanel.disableControl("Annotation file");

      // enable creation
      // (the temp annot will 'really' be created at the first click)
      that._annotationCollection.enableAnnotCreation();
    });
    this._annotationPanel.overrideStyle("Start new annotation", "width", "100%");

    // Button to validate a homemade annotation
    this._annotationPanel.addButton("Validate annotation", function(){
      // show and hide the relevant componants
      that._annotationPanel.showControl("panelEditExistingAnnot");
      that._annotationPanel.hideControl("panelCreateAnnot");
      that._annotationPanel.hideControl("Validate annotation");
      that._annotationPanel.showControl("Start new annotation");

      // allow the user to interact
      that._annotationPanel.enableControl("Annotations");
      that._annotationPanel.enableControl("Export annotations");
      that._annotationPanel.enableControl("Annotation file");

      // done with the creation
      that._annotationCollection.addTemporaryAnnotation();

    });
    this._annotationPanel.overrideStyle("Validate annotation", "width", "100%");
    this._annotationPanel.hideControl("Validate annotation");

    // homemade annot options
    this._annotationPanel.addHTML("panelCreateAnnot", this._buildPanelCreateAnnot());
    document.getElementById("panelCreateAnnot").parentElement.style["margin-top"] = "0px";
    this._annotationPanel.hideControl("panelCreateAnnot");
  }


  /**
  * [PRIVATE]
  * Builds the HTML edit panel for annotations
  */
  _buildPanelEditExistingAnnot(){
    var htmlStr = `
    <div>
      <i id="existingAnnotValidate" class="fa fa-check small-icon" aria-hidden="true"></i>
      <i id="existingAnnotToggleView" class="fa fa-eye small-icon" aria-hidden="true"></i>
      <i id="existingAnnotTarget" class="fa fa-crosshairs small-icon" aria-hidden="true"></i>
      <i id="existingAnnotColorPicker" class="fa fa-paint-brush small-icon" aria-hidden="true"></i>
      <i  id="existingAnnotDelete" class="fa fa-trash small-icon" aria-hidden="true"></i>
    </div>
    `;

    return htmlStr;
  }


  /**
  * [PRIVATE]
  * Builds the pannel with buttons to create a new annotation
  */
  _buildPanelCreateAnnot(){
    var htmlStr = `
    <div>
      <i id="newAnnotUndo" class="fa fa-undo small-icon" aria-hidden="true"></i>
      <i id="newAnnotPaintColorPicker" class="fa fa-paint-brush small-icon" aria-hidden="true"></i>
      <i id="newAnnotDelete" class="fa fa-trash small-icon" aria-hidden="true"></i>
    </div>
    `;

    return htmlStr;
  }


  _initAnnotationPanelCallback(){
    var that = this;

    // existing annotations -------------------------

    // check - validate the change of name/description if any
    document.getElementById("existingAnnotValidate").onclick = function(e){
      console.log(e);
    }

    // eye - show/hide the annot
    document.getElementById("existingAnnotToggleView").onclick = function(e){
      console.log(e);
    }

    // target - center the annot
    document.getElementById("existingAnnotTarget").onclick = function(e){
      console.log(e);
    }

    // paint brush - change annot color
    document.getElementById("existingAnnotColorPicker").onclick = function(e){
      console.log(e);
    }

    // trashbin - delete the annot
    document.getElementById("existingAnnotDelete").onclick = function(e){
      console.log(e);
    }

    // new annotations -------------------------

    // Undo - remove the last point added
    document.getElementById("newAnnotUndo").onclick = function(e){
      console.log(e);
    }

    // Paint brush - change color of the annot
    document.getElementById("newAnnotPaintColorPicker").onclick = function(e){
      console.log(e);
    }

    // trashbin - delete the annot
    document.getElementById("newAnnotDelete").onclick = function(e){
      console.log(e);
    }


    //
    this._quadViewInteraction.onClickPlane(
      "ortho",

      function( point ){
        console.log("From GUI:");
        console.log(point);

        // the annotation creation processes is enabled
        if( that._annotationCollection.isAnnotCreationEnabled() ){
          var temporaryAnnot = that._annotationCollection.getTemporaryAnnotation();

          // appending a new point
          if( temporaryAnnot ){
            temporaryAnnot.addPoint( [point.x, point.y, point.z] );
          }
          // init the temporary annot
          else{
            that._annotationCollection.createTemporaryAnnotation( point );
            that._displayAnnotInfo( that._annotationCollection.getTemporaryAnnotation() );
          }

        }
      }
    )

  }


  /**
  * Display annotation info in the text box.
  * @param {Annotation} annot - an instance of annotation,
  * most likely the temporary one from the collection.
  */
  _displayAnnotInfo( annot ){
    this._annotationPanel.setValue("Annotation name", annot.getName());
    this._annotationPanel.setValue("Annotation description", annot.getDescription());
  }


}/* END class GuiController */

export { GuiController };
