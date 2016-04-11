"use strict";

/**
 * Class responsible for presenting the map.
 * @module MapDisplay
 *
 * @author Jean Souza [jean.souza@funcate.org.br]
 *
 * @property {ol.interaction.DragBox} memberZoomDragBox - DragBox object.
 * @property {array} memberInitialExtent - Initial extent.
 * @property {object} memberParser - Capabilities parser.
 * @property {ol.Map} memberOlMap - Map object.
 * @property {int} memberResolutionChangeEventKey - Resolution change event key.
 * @property {int} memberDoubleClickEventKey - Double click event key.
 * @property {object} memberSocket - Socket object.
 */
TerraMA2WebComponents.webcomponents.MapDisplay = (function() {

  // DragBox object
  var memberZoomDragBox = null;
  // Initial extent
  var memberInitialExtent = null;
  // Capabilities parser
  var memberParser = null;
  // Map object
  var memberOlMap = new ol.Map({
    renderer: 'canvas',
    target: 'terrama2-map',
    view: new ol.View({ projection: 'EPSG:4326', center: [-55, -15], zoom: 3 })
  });
  // Resolution change event key
  var memberResolutionChangeEventKey = null;
  // Double click event key
  var memberDoubleClickEventKey = null;
  // Socket object
  var memberSocket = null;

  /**
   * Returns the map object.
   * @returns {ol.Map} memberOlMap - Map object
   *
   * @function getMap
   */
  var getMap = function() {
    return memberOlMap;
  };

  /**
   * Updates the map size accordingly to its container.
   *
   * @function updateMapSize
   */
  var updateMapSize = function() {
    var interval = window.setInterval(function() { memberOlMap.updateSize(); }, 10);
    window.setTimeout(function() { clearInterval(interval); }, 600);
  };

  /**
   * Corrects the longitude of the map, if it's wrong. That's necessary because Openlayers 3 (in the current version) has a bug, when the map is moved to the right or to the left the X coordinate keeps growing.
   * @param {float} longitude - Original longitude
   * @returns {float} correctedLongitude - Corrected longitude
   *
   * @private
   * @function correctLongitude
   */
  var correctLongitude = function(longitude) {
    // Variable that will keep the corrected longitude
    var correctedLongitude = parseFloat(longitude);
    // Variable that will keep the original longitude
    var originalLongitude = parseFloat(longitude);

    // The correction is executed only if the longitude is incorrect
    if(originalLongitude > 180 || originalLongitude <= -180) {
      // If the longitude is negative, it's converted to a positive float, otherwise just to a float
      longitude = originalLongitude < 0 ? longitude * -1 : parseFloat(longitude);

      // Division of the longitude by 180:
      //   If the result is an even negative integer, nothing is added, subtracted or rounded
      //   If the result is an odd negative integer, is added 1 to the result
      //   If the result is a positive integer, is subtracted 1 from the result
      //   If isn't integer but its integer part is even, it's rounded down
      //   Otherwise, it's rounded up
      var divisionResult = 0;
      if((originalLongitude / 180) % 2 === -0)
        divisionResult = longitude / 180;
      else if((originalLongitude / 180) % 2 === -1)
        divisionResult = (longitude / 180) + 1;
      else if((longitude / 180) % 1 === 0)
        divisionResult = (longitude / 180) - 1;
      else if(parseInt(longitude / 180) % 2 === 0)
        divisionResult = parseInt(longitude / 180);
      else
        divisionResult = Math.ceil(longitude / 180);

      // If the division result is greater than zero, the correct longitude is calculated:
      //   If the original longitude is negative, the division result multiplied by 180 is added to it
      //   Otherwise, the division result multiplied by 180 is subtracted from it
      if(divisionResult > 0)
        correctedLongitude = (originalLongitude < 0) ? originalLongitude + (divisionResult * 180) : originalLongitude - (divisionResult * 180);
    }

    return correctedLongitude;
  };

  /**
   * Adds a mouse position display in the map.
   *
   * @function addMousePosition
   */
  var addMousePosition = function() {
    var controlAlreadyExists = false;

    memberOlMap.getControls().forEach(function(control, i) {
      if(control instanceof ol.control.MousePosition) {
        controlAlreadyExists = true;
        return;
      }
    });

    if(!controlAlreadyExists) {
      $("#terrama2-map").append('<div id="terrama2-map-info"></div>');

      var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: (function(precision) {
          return (function(coordinates) {
            return ol.coordinate.toStringXY([correctLongitude(coordinates[0]), coordinates[1]], precision);
          });
        })(6),
        projection: 'EPSG:4326',
        className: 'terrama2-mouse-position',
        target: document.getElementById('terrama2-map-info')
      });

      memberOlMap.addControl(mousePositionControl);
    }
  };

  /**
   * Removes the mouse position display from the map.
   *
   * @function removeMousePosition
   */
  var removeMousePosition = function() {
    $("#terrama2-map-info").remove();

    memberOlMap.getControls().forEach(function(control, i) {
      if(control instanceof ol.control.MousePosition) {
        memberOlMap.removeControl(control);
        return;
      }
    });
  };

  /**
   * Adds a scale display in the map.
   *
   * @function addScale
   */
  var addScale = function() {
    var controlAlreadyExists = false;

    memberOlMap.getControls().forEach(function(control, i) {
      if(control instanceof ol.control.ScaleLine) {
        controlAlreadyExists = true;
        return;
      }
    });

    if(!controlAlreadyExists)
      memberOlMap.addControl(new ol.control.ScaleLine());
  };

  /**
   * Removes the scale display from the map.
   *
   * @function removeScale
   */
  var removeScale = function() {
    memberOlMap.getControls().forEach(function(control, i) {
      if(control instanceof ol.control.ScaleLine) {
        memberOlMap.removeControl(control);
        return;
      }
    });
  };

  /**
   * Enables the double click zoom.
   *
   * @function enableDoubleClickZoom
   */
  var enableDoubleClickZoom = function() {
    var interactionAlreadyExists = false;

    memberOlMap.getInteractions().forEach(function(interaction, i) {
      if(interaction instanceof ol.interaction.DoubleClickZoom) {
        interactionAlreadyExists = true;
        return;
      }
    });

    if(!interactionAlreadyExists)
      memberOlMap.addInteraction(new ol.interaction.DoubleClickZoom());
  };

  /**
   * Disables the double click zoom.
   *
   * @function disableDoubleClickZoom
   */
  var disableDoubleClickZoom = function() {
    memberOlMap.getInteractions().forEach(function(interaction, i) {
      if(interaction instanceof ol.interaction.DoubleClickZoom) {
        memberOlMap.removeInteraction(interaction);
        return;
      }
    });
  };

  /**
   * Creates a new layer group.
   * @param {string} id - Layer group id
   * @param {string} name - Layer group name
   * @returns {ol.layer.Group} layerGroup - New layer group
   *
   * @private
   * @function createLayerGroup
   */
  var createLayerGroup = function(id, name) {
    var layerGroup = new ol.layer.Group({
      id: id,
      name: name
    });

    return layerGroup;
  };

  /**
   * Adds a new layer group to the map.
   * @param {string} id - Layer group id
   * @param {string} name - Layer group name
   *
   * @function addLayerGroup
   */
  var addLayerGroup = function(id, name) {
    var layerGroup = findBy(memberOlMap.getLayerGroup(), 'id', 'terrama2-layerexplorer');

    if(layerGroup !== null) {
      var layers = layerGroup.getLayers();

      layers.push(createLayerGroup(id, name));
      layerGroup.setLayers(layers);

      var interval = window.setInterval(function() {
        if(TerraMA2WebComponents.obj.isComponentsLoaded()) {
          TerraMA2WebComponents.webcomponents.LayerExplorer.addLayersFromMap(id, 'terrama2-layerexplorer');
          clearInterval(interval);
        }
      }, 10);
    }
  };

  /**
   * Creates a new tiled wms layer.
   * @param {string} url - Url to the wms layer
   * @param {string} type - Server type
   * @param {string} layerId - Layer id
   * @param {string} layerName - Layer name
   * @param {boolean} layerVisible - Flag that indicates if the layer should be visible on the map when created
   * @param {float} minResolution - Layer minimum resolution
   * @param {float} maxResolution - Layer maximum resolution
   * @param {string} time - Time parameter for temporal layers
   * @returns {ol.layer.Tile} tile - New tiled wms layer
   *
   * @function createTileWMS
   */
  var createTileWMS = function(url, type, layerId, layerName, layerVisible, minResolution, maxResolution, time) {
    var params = {
      'LAYERS': layerId,
      'TILED': true
    };

    if(time !== null && time !== undefined && time !== '')
      params['TIME'] = time;

    var tile = new ol.layer.Tile({
      source: new ol.source.TileWMS({
        preload: Infinity,
        url: url,
        serverType: type,
        params: params
      }),
      id: layerId,
      name: layerName,
      visible: layerVisible
    });

    if(minResolution !== undefined && minResolution !== null)
      tile.setMinResolution(minResolution);

    if(maxResolution !== undefined && maxResolution !== null)
      tile.setMaxResolution(maxResolution);

    return tile;
  };

  /**
   * Adds a new tiled wms layer to the map.
   * @param {string} url - Url to the wms layer
   * @param {string} type - Server type
   * @param {string} layerId - Layer id
   * @param {string} layerName - Layer name
   * @param {boolean} layerVisible - Flag that indicates if the layer should be visible on the map when created
   * @param {float} minResolution - Layer minimum resolution
   * @param {float} maxResolution - Layer maximum resolution
   * @param {string} parentGroup - Parent group id
   * @param {string} time - Time parameter for temporal layers
   *
   * @function addTileWMSLayer
   */
  var addTileWMSLayer = function(url, type, layerId, layerName, layerVisible, minResolution, maxResolution, parentGroup, time) {
    var layerGroup = findBy(memberOlMap.getLayerGroup(), 'id', parentGroup);

    if(layerGroup !== null) {
      var layers = layerGroup.getLayers();

      layers.push(
        createTileWMS(url, type, layerId, layerName, layerVisible, minResolution, maxResolution, time)
      );

      layerGroup.setLayers(layers);

      var interval = window.setInterval(function() {
        if(TerraMA2WebComponents.obj.isComponentsLoaded()) {
          TerraMA2WebComponents.webcomponents.LayerExplorer.addLayersFromMap(layerId, parentGroup);
          clearInterval(interval);
        }
      }, 10);
    }
  };

  /**
   * Creates a new GeoJSON vector layer.
   * @param {string} url - Url to the wms layer
   * @param {string} layerId - Layer id
   * @param {string} layerName - Layer name
   * @param {boolean} layerVisible - Flag that indicates if the layer should be visible on the map when created
   * @param {float} minResolution - Layer minimum resolution
   * @param {float} maxResolution - Layer maximum resolution
   * @param {array} fillColors - Array with the fill colors
   * @param {array} strokeColors - Array with the stroke colors
   * @param {function} styleFunction - Function responsible for attributing the colors to the layer features
   * @returns {ol.layer.Vector} vector - New GeoJSON vector layer
   *
   * @private
   * @function createGeoJSONVector
   */
  var createGeoJSONVector = function(url, layerId, layerName, layerVisible, minResolution, maxResolution, fillColors, strokeColors, styleFunction) {
    var vector = new ol.layer.Vector({
      source: new ol.source.Vector({
        url: url,
        format: new ol.format.GeoJSON(),
        strategy: ol.loadingstrategy.bbox
      }),
      style: function(feature) {
        var colors = styleFunction(feature, fillColors, strokeColors);
        return createStyle(colors.fillColor, colors.strokeColor);
      },
      id: layerId,
      name: layerName,
      visible: layerVisible
    });

    if(minResolution !== undefined && minResolution !== null)
      vector.setMinResolution(minResolution);

    if(maxResolution !== undefined && maxResolution !== null)
      vector.setMaxResolution(maxResolution);

    return vector;
  };

  /**
   * Adds a new GeoJSON vector layer to the map.
   * @param {string} url - Url to the wms layer
   * @param {string} layerId - Layer id
   * @param {string} layerName - Layer name
   * @param {boolean} layerVisible - Flag that indicates if the layer should be visible on the map when created
   * @param {float} minResolution - Layer minimum resolution
   * @param {float} maxResolution - Layer maximum resolution
   * @param {array} fillColors - Array with the fill colors
   * @param {array} strokeColors - Array with the stroke colors
   * @param {function} styleFunction - Function responsible for attributing the colors to the layer features
   * @param {string} parentGroup - Parent group id
   *
   * @function addGeoJSONVectorLayer
   */
  var addGeoJSONVectorLayer = function(url, layerId, layerName, layerVisible, minResolution, maxResolution, fillColors, strokeColors, styleFunction, parentGroup) {
    var layerGroup = findBy(memberOlMap.getLayerGroup(), 'id', parentGroup);

    if(layerGroup !== null) {
      var layers = layerGroup.getLayers();

      layers.push(
        createGeoJSONVector(url, layerId, layerName, layerVisible, minResolution, maxResolution, fillColors, strokeColors, styleFunction)
      );

      layerGroup.setLayers(layers);

      var interval = window.setInterval(function() {
        if(TerraMA2WebComponents.obj.isComponentsLoaded()) {
          TerraMA2WebComponents.webcomponents.LayerExplorer.addLayersFromMap(layerId, parentGroup);
          clearInterval(interval);
        }
      }, 10);
    }
  };

  /**
   * Adds a layer group of base layers to the map.
   * @param {string} id - Layer id
   * @param {string} name - Layer name
   *
   * @function addBaseLayers
   */
  var addBaseLayers = function(id, name) {
    var layerGroup = findBy(memberOlMap.getLayerGroup(), 'id', 'terrama2-layerexplorer');

    if(layerGroup !== null) {
      var layers = layerGroup.getLayers();

      layers.push(
        new ol.layer.Group({
          layers: [
            new ol.layer.Tile({
              source: new ol.source.OSM(),
              id: 'osm',
              name: 'Open Street Map',
              visible: false
            }),
            new ol.layer.Tile({
              source: new ol.source.MapQuest({layer: 'osm'}),
              id: 'mapquest_osm',
              name: 'MapQuest OSM',
              visible: false
            }),
            new ol.layer.Tile({
              source: new ol.source.MapQuest({layer: 'sat'}),
              id: 'mapquest_sat',
              name: 'MapQuest Sat&eacute;lite',
              visible: true
            })
          ],
          id: id,
          name: name
        })
      );

      layerGroup.setLayers(layers);

      var interval = window.setInterval(function() {
        if(TerraMA2WebComponents.obj.isComponentsLoaded()) {
          TerraMA2WebComponents.webcomponents.LayerExplorer.addLayersFromMap(id, 'terrama2-layerexplorer');
          clearInterval(interval);
        }
      }, 10);
    }
  };

  /**
   * Adds the layers of a given capabilities to the map.
   * @param {string} capabilitiesUrl - Capabilities URL
   * @param {string} serverUrl - Server URL
   * @param {string} serverType - Server type
   * @param {string} serverId - Server id
   * @param {string} serverName - Server name
   *
   * @function addCapabilitiesLayers
   */
  var addCapabilitiesLayers = function(capabilitiesUrl, serverUrl, serverType, serverId, serverName) {
    memberSocket.emit('proxyRequest', { url: capabilitiesUrl, additionalParameters: { serverUrl: serverUrl, serverType: serverType, serverId: serverId, serverName: serverName } });
  };

  /**
   * Creates the capabilities layers in the map.
   * @param {xml} xml - Xml code of the server capabilities
   * @param {string} serverUrl - Server URL
   * @param {string} serverType - Server type
   * @param {string} serverId - Server id
   * @param {string} serverName - Server name
   *
   * @private
   * @function createCapabilitiesLayers
   */
  var createCapabilitiesLayers = function(xml, serverUrl, serverType, serverId, serverName) {
    var capabilities = memberParser.read(xml);
    var layers = capabilities.Capability.Layer;

    var tilesWMSLayers = [];

    var layersLength = layers.Layer.length;
    for(var i = 0; i < layersLength; i++) {
      if(layers.Layer[i].hasOwnProperty('Layer')) {

        var subLayersLength = layers.Layer[i].Layer.length;
        for(var j = 0; j < subLayersLength; j++) {
          tilesWMSLayers.push(createTileWMS(serverUrl, serverType, layers.Layer[i].Layer[j].Name, layers.Layer[i].Layer[j].Title, false));
        }
      } else {
        tilesWMSLayers.push(createTileWMS(serverUrl, serverType, layers.Layer[i].Name, layers.Layer[i].Title, false));
      }
    }

    var layerGroup = new ol.layer.Group({
      layers: tilesWMSLayers,
      id: serverId,
      name: serverName
    });

    var parentLayerGroup = findBy(memberOlMap.getLayerGroup(), 'id', 'terrama2-layerexplorer');

    if(parentLayerGroup !== null) {
      var parentSubLayers = parentLayerGroup.getLayers();

      parentSubLayers.push(
        layerGroup
      );

      parentLayerGroup.setLayers(parentSubLayers);

      var interval = window.setInterval(function() {
        if(TerraMA2WebComponents.obj.isComponentsLoaded()) {
          TerraMA2WebComponents.webcomponents.LayerExplorer.addLayersFromMap(serverId, 'terrama2-layerexplorer');
          clearInterval(interval);
        }
      }, 10);
    }
  };

  /**
   * Creates a new Openlayers Style object.
   * @param {string} fill - Layer fill color
   * @param {string} stroke - Layer stroke color
   * @returns {ol.style.Style} new ol.style.Style - New Openlayers Style object
   *
   * @private
   * @function createStyle
   */
  var createStyle = function(fill, stroke) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: fill
      }),
      stroke: new ol.style.Stroke({
        color: stroke,
        width: 2
      })
    });
  };

  /**
   * Sets the visibility of a given layer or layer group, if it is visible, it will be hidden, otherwise will be shown.
   * @param {ol.layer} layer - Layer or layer group
   *
   * @function setLayerVisibility
   */
  var setLayerVisibility = function(layer) {
    layer.setVisible(!layer.getVisible());

    if(layer.getLayers) {
      var layers = layer.getLayers().getArray();
      var len = layers.length;
      for(var i = 0; i < len; i++) {
        layers[i].setVisible(layer.getVisible());
      }
    }

    $(document).trigger("layerVisibilityChange", [layer.get('id')]);
  };

  /**
   * Sets the visibility of a given layer or layer group by its id.
   * @param {string} layerId - Layer id
   * @param {boolean} visibilityFlag - Visibility flag, true to show and false to hide
   *
   * @function setLayerVisibilityById
   */
  var setLayerVisibilityById = function(layerId, visibilityFlag) {
    var layer = findBy(memberOlMap.getLayerGroup(), 'id', layerId);
    layer.setVisible(visibilityFlag);

    if(layer.getLayers) {
      var layers = layer.getLayers().getArray();
      var len = layers.length;
      for(var i = 0; i < len; i++) {
        layers[i].setVisible(visibilityFlag);
      }
    }

    $(document).trigger("layerVisibilityChange", [layerId]);
  };

  /**
   * Returns the flag that indicates if the given layer is visible.
   * @param {string} layerId - Layer id
   *
   * @function isLayerVisible
   */
  var isLayerVisible = function(layerId) {
    var layer = findBy(memberOlMap.getLayerGroup(), 'id', layerId);
    return layer.get('visible');
  };

  /**
   * Sets the layer visibility change event.
   * @param {function} eventFunction - Function to be executed when the event is triggered
   *
   * @function setLayerVisibilityChangeEvent
   */
  var setLayerVisibilityChangeEvent = function(eventFunction) {
    $(document).unbind("layerVisibilityChange");
    $(document).on("layerVisibilityChange", function(e, layerId) {
      eventFunction(layerId);
    });
  };

  /**
   * Adds the Zoom DragBox to the map.
   *
   * @function addZoomDragBox
   */
  var addZoomDragBox = function() {
    memberOlMap.addInteraction(memberZoomDragBox);
  };

  /**
   * Removes the Zoom DragBox from the map.
   *
   * @function removeZoomDragBox
   */
  var removeZoomDragBox = function() {
    memberOlMap.removeInteraction(memberZoomDragBox);
  };

  /**
   * Returns the current Zoom DragBox extent.
   * @returns {array} extent - Zoom DragBox extent
   *
   * @function getZoomDragBoxExtent
   */
  var getZoomDragBoxExtent = function() {
    var extentTmp = memberZoomDragBox.getGeometry().getExtent();
    var extent = [correctLongitude(extentTmp[0]), extentTmp[1], correctLongitude(extentTmp[2]), extentTmp[3]];

    // Zoom to the correct extent
    zoomToExtent(extent);

    return extent;
  };

  /**
   * Sets the Zoom DragBox start event.
   * @param {function} eventFunction - Function to be executed when the event is triggered
   *
   * @function setZoomDragBoxStartEvent
   */
  var setZoomDragBoxStartEvent = function(eventFunction) {
    memberZoomDragBox.on('boxstart', function(e) {
      eventFunction();
    });
  };

  /**
   * Sets the Zoom DragBox end event.
   * @param {function} eventFunction - Function to be executed when the event is triggered
   *
   * @function setZoomDragBoxEndEvent
   */
  var setZoomDragBoxEndEvent = function(eventFunction) {
    memberZoomDragBox.on('boxend', function(e) {
      eventFunction();
    });
  };

  /**
   * Returns the current map extent.
   * @returns {array} extent - Map extent
   *
   * @function getCurrentExtent
   */
  var getCurrentExtent = function() {
    var extentTmp = memberOlMap.getView().calculateExtent(memberOlMap.getSize());
    var extent = [correctLongitude(extentTmp[0]), extentTmp[1], correctLongitude(extentTmp[2]), extentTmp[3]];
    return extent;
  };

  /**
   * Zooms to the initial map extent.
   *
   * @function zoomToInitialExtent
   */
  var zoomToInitialExtent = function() {
    memberOlMap.getView().fit(memberInitialExtent, memberOlMap.getSize(), { constrainResolution: false });
  };

  /**
   * Zooms to the received extent.
   * @param {array} extent - Extent
   *
   * @function zoomToExtent
   */
  var zoomToExtent = function(extent) {
    memberOlMap.getView().fit(extent, memberOlMap.getSize(), { constrainResolution: false });
  };

  /**
   * Returns the current map resolution.
   * @returns {float} resolution - Map resolution
   *
   * @function getCurrentResolution
   */
  var getCurrentResolution = function() {
    return memberOlMap.getView().getResolution();
  };

  /**
   * Verifies if the current resolution is valid for a given layer.
   * @param {string} layerId - Layer id
   * @returns {boolean} flag - Flag that indicates if the current resolution is valid for the layer
   *
   * @function isCurrentResolutionValidForLayer
   */
  var isCurrentResolutionValidForLayer = function(layerId) {
    var layer = findBy(memberOlMap.getLayerGroup(), 'id', layerId);
    var currentResolution = getCurrentResolution();

    return layer!== null && (layer.getMaxResolution() >= currentResolution && layer.getMinResolution() <= currentResolution);
  };

  /**
   * Sets the Map resolution change event.
   * @param {function} eventFunction - Function to be executed when the event is triggered
   *
   * @function setMapResolutionChangeEvent
   */
  var setMapResolutionChangeEvent = function(eventFunction) {
    if(memberResolutionChangeEventKey !== null) memberOlMap.getView().unByKey(memberResolutionChangeEventKey);
    memberResolutionChangeEventKey = memberOlMap.getView().on('propertychange', function(e) {
      switch(e.key) {
        case 'resolution':
          eventFunction();
          break;
      }
    });
  };

  /**
   * Sets the Map double click event.
   * @param {function} eventFunction - Function to be executed when the event is triggered
   *
   * @function setMapDoubleClickEvent
   */
  var setMapDoubleClickEvent = function(eventFunction) {
    if(memberDoubleClickEventKey !== null) memberOlMap.getView().unByKey(memberDoubleClickEventKey);
    memberDoubleClickEventKey = memberOlMap.on('dblclick', function(e) {
      eventFunction(correctLongitude(e.coordinate[0]), e.coordinate[1]);
    });
  };

  /**
   * Finds a layer by a given key.
   * @param {ol.layer.Group} layer - The layer group where the method will run the search
   * @param {string} key - Layer attribute to be used in the search
   * @param {string} value - Value to be used in the search
   * @returns {ol.layer} layer - Layer found
   *
   * @function findBy
   */
  var findBy = function(layer, key, value) {
    if(layer.get(key) === value)
      return layer;

    if(layer.getLayers) {
      var layers = layer.getLayers().getArray(),
      len = layers.length, result;
      for(var i = 0; i < len; i++) {
        result = findBy(layers[i], key, value);
        if(result)
          return result;
      }
    }

    return null;
  };

  /**
   * Applies a given CQL filter to a given layer.
   * @param {string} cql - CQL filter to be applied
   * @param {string} layerId - Layer id to be filtered
   *
   * @function applyCQLFilter
   */
  var applyCQLFilter = function(cql, layerId) {
    findBy(memberOlMap.getLayerGroup(), 'id', layerId).getSource().updateParams({ "CQL_FILTER": cql });
  };

  /**
   * Loads the sockets listeners.
   *
   * @private
   * @function loadSocketsListeners
   */
  var loadSocketsListeners = function() {
    memberSocket.on('proxyResponse', function(response) {
      createCapabilitiesLayers(response.msg, response.additionalParameters.serverUrl, response.additionalParameters.serverType, response.additionalParameters.serverId, response.additionalParameters.serverName);
    });
  };

  /**
   * Alters the index of a layer.
   * @param {string} parent - Parent id
   * @param {int} indexFrom - Current index of the layer
   * @param {int} indexTo - New index
   *
   * @function alterLayerIndex
   */
  var alterLayerIndex = function(parent, indexFrom, indexTo) {
    var layers = findBy(memberOlMap.getLayerGroup(), 'id', parent).getLayers();
    var layer = layers.removeAt(indexFrom);
    layers.insertAt(indexTo, layer);
  };

  /**
   * Initializes the necessary features.
   *
   * @function init
   */
  var init = function() {
    memberParser = new ol.format.WMSCapabilities();
    memberSocket = io(TerraMA2WebComponents.obj.getTerrama2Url());

    memberOlMap.getLayerGroup().set('id', 'terrama2-layerexplorer');
    memberOlMap.getLayerGroup().set('name', 'terrama2-layerexplorer');

    memberZoomDragBox = new ol.interaction.DragBox({
      condition: ol.events.condition.always
    });

    memberInitialExtent = memberOlMap.getView().calculateExtent(memberOlMap.getSize());

    loadSocketsListeners();

    $(document).ready(function() {
      updateMapSize();
    });
  };

  return {
    getMap: getMap,
    updateMapSize: updateMapSize,
    correctLongitude: correctLongitude,
    addMousePosition: addMousePosition,
    removeMousePosition: removeMousePosition,
    addScale: addScale,
    removeScale: removeScale,
    enableDoubleClickZoom: enableDoubleClickZoom,
    disableDoubleClickZoom: disableDoubleClickZoom,
    addLayerGroup: addLayerGroup,
    createTileWMS: createTileWMS,
    addTileWMSLayer: addTileWMSLayer,
    addGeoJSONVectorLayer: addGeoJSONVectorLayer,
    addBaseLayers: addBaseLayers,
    addCapabilitiesLayers: addCapabilitiesLayers,
    setLayerVisibility: setLayerVisibility,
    setLayerVisibilityById: setLayerVisibilityById,
    isLayerVisible: isLayerVisible,
    setLayerVisibilityChangeEvent: setLayerVisibilityChangeEvent,
    addZoomDragBox: addZoomDragBox,
    removeZoomDragBox: removeZoomDragBox,
    getZoomDragBoxExtent: getZoomDragBoxExtent,
    setZoomDragBoxStartEvent: setZoomDragBoxStartEvent,
    setZoomDragBoxEndEvent: setZoomDragBoxEndEvent,
    getCurrentExtent: getCurrentExtent,
    zoomToInitialExtent: zoomToInitialExtent,
    zoomToExtent: zoomToExtent,
    getCurrentResolution: getCurrentResolution,
    isCurrentResolutionValidForLayer: isCurrentResolutionValidForLayer,
    setMapResolutionChangeEvent: setMapResolutionChangeEvent,
    setMapDoubleClickEvent: setMapDoubleClickEvent,
    findBy: findBy,
    applyCQLFilter: applyCQLFilter,
    alterLayerIndex: alterLayerIndex,
    init: init
  };
})();
