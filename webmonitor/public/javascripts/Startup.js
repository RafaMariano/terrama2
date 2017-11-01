requirejs.config({
  baseUrl: BASE_URL + 'javascripts',
  paths: {
    TerraMA2WebComponents: BASE_URL + 'externals/TerraMA2WebComponents/TerraMA2WebComponents.min'
  }
});

requirejs(
  ['TerraMA2WebMonitor',
    'components/Calendar',
    'components/Slider',
    'components/AttributesTable',
    'components/Legends',
    'components/GetAttributesTool',
    'components/MapTools',
    'components/Utils',
    'components/AddLayerByUri',
    'components/LayerToolbox',
    'components/Login',
    'components/AnimatedLayer',
    'components/State',
    'TerraMA2WebComponents'
  ],
  function(
    TerraMA2WebMonitor,
    Calendar,
    Slider,
    AttributesTable,
    Legends,
    GetAttributesTool,
    MapTools,
    Utils,
    AddLayerByUri,
    LayerToolbox,
    Login,
    AnimatedLayer,
    State,
    TerraMA2WebComponents
  ) {
    TerraMA2WebComponents.LayerExplorer.init();
    TerraMA2WebComponents.MapDisplay.init();




    i18next.use(i18nextXHRBackend).init({
      lng: 'en',
      backend: {
        loadPath: '/locales/{{lng}}.json'
      }
    }, function(err, t) {
      // for options see
      // https://github.com/i18next/jquery-i18next#initialize-the-plugin
      jqueryI18next.init(i18next, $);
      // start localizing, details:
      // https://github.com/i18next/jquery-i18next#usage-of-selector-function
      $('body').localize();
    });




    Utils.init(null, function() {
      TerraMA2WebMonitor.init();
      Calendar.init();
      Slider.init();
      AttributesTable.init();
      Legends.init();
      GetAttributesTool.init();
      MapTools.init();
      AddLayerByUri.init();
      LayerToolbox.init();
      AnimatedLayer.init();
      State.init();
      Login.init();
    });
  }
);