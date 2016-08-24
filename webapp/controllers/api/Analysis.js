"use strict";

var DataManager = require("../../core/DataManager.js");
var Utils = require('./../../core/Utils');
var TokenCode = require('./../../core/Enums').TokenCode;
var TcpManager = require("../../core/TcpManager");
var AnalysisError = require("./../../core/Exceptions").AnalysisError;
var AnalysisFacade = require("./../../core/facade/Analysis");

module.exports = function(app) {
  return {
    get: function(request, response) {
      var analysisId = request.params.id;
      var restriction = analysisId ? {id: analysisId} : {};
      restriction.project_id = app.locals.activeProject.id;

      AnalysisFacade.list(restriction).then(function(analysis) {
        return response.json(analysis);
      }).catch(function(err) {
        response.status(400);
        response.json({status: 400, message: err.message});
      });
    },

    post: function(request, response) {
      var analysisObject = request.body.analysis;
      var storager = request.body.storager;
      var scheduleObject = request.body.schedule;

      try {
        analysisObject.type = Utils.getAnalysisType(analysisObject.type_id);

        // if does not have project_id, getting from cache
        if (!analysisObject.project_id) { analysisObject.project_id = app.locals.activeProject.id; }

        // temp code. TODO:fix
        analysisObject.script_language_id = 1;
        analysisObject.data_series_id = analysisObject.dataSeries.id;

        var dataSeries = {
          name: analysisObject.name,
          description: "Generated by analysis " + analysisObject.name,
          data_provider_id: analysisObject.data_provider_id,
          data_series_semantic_id: storager.semantics.format.id,
          dataSets: [
            {
              active: true,
              format: storager.format
            }
          ]
        };

        AnalysisFacade.save(analysisObject, scheduleObject, dataSeries).then(function(analysisResult) {
          DataManager.listServiceInstances({}).then(function(services) {
            services.forEach(function(service) {
              try {
                TcpManager.emit('sendData', service, {
                  "DataSeries": [analysisResult.dataSeries.toObject()],
                  "Analysis": [analysisResult.toObject()]
                });
              } catch (e) {
                console.log(e);
              }
            });

            console.log(JSON.stringify({
              "DataSeries": [analysisResult.dataSeries.toObject()],
              "Analysis": [analysisResult.toObject()]
            }));

            // generating token
            var token = Utils.generateToken(app, TokenCode.SAVE, analysisResult.name);
            response.json({status: 200, result: analysisResult.toObject(), token: token});
          }).catch(function(err) {
            console.log(err);
            Utils.handleRequestError(response, err, 400);
          });
        }).catch(function(err) {
          console.log(err);
          Utils.handleRequestError(response, err, 400);
        });
      } catch (err) {
        Utils.handleRequestError(response, err, 400);
      }
    },

    put: function(request, response) {
      var analysisId = request.params.id;

      if (analysisId) {
        var analysisObject = request.body.analysis;
        var scheduleObject = request.body.schedule;

        DataManager.updateAnalysis(analysisId, analysisObject, scheduleObject).then(function() {
          DataManager.getAnalysis({id: analysisId, project_id: app.locals.activeProject.id}).then(function(analysisInstance) {

            Utils.sendDataToServices(DataManager, TcpManager, {
              "DataSeries": [analysisInstance.dataSeries.toObject()],
              "Analysis": [analysisInstance.toObject()]
            });

            // generating token
            var token = Utils.generateToken(app, TokenCode.UPDATE, analysisInstance.name);
            response.json({status: 200, result: analysisInstance.toObject(), token: token});
          }).catch(function(err) {
            console.log("Error while retrieving updated analysis");
            console.log(err);
            Utils.handleRequestError(response, err, 400);
          });
        }).catch(function(err) {
          Utils.handleRequestError(response, err, 400);
        });
      } else {
        Utils.handleRequestError(response, new AnalysisError("Missing analysis id"), 400);
      }
    },

    delete: function(request, response) {
      var id = request.params.id;
      if(id) {
        DataManager.getAnalysis({id: id, project_id: app.locals.activeProject.id}).then(function(analysis) {
          DataManager.removeAnalysis({id: id}, null).then(function() {
            var objectToSend = {
              "Analysis": [analysis.id],
              "DataSeries": [analysis.dataSeries.id]
            };

            DataManager.listServiceInstances().then(function(servicesInstance) {
              servicesInstance.forEach(function (service) {
                try {
                  TcpManager.emit('removeData', service, objectToSend);

                } catch (e) {
                  console.log(e);
                }
              });

              response.json({status: 200, name: analysis.name});
            }).catch(function(err) {
              Utils.handleRequestError(response, err, 400);
            });
          }).catch(function(err) {
            Utils.handleRequestError(response, err, 400);
          });
        }).catch(function(err) {
          Utils.handleRequestError(response, err, 400);
        });
      } else {
        Utils.handleRequestError(response, new AnalysisError("Missing analysis id"), 400);
      }
    }
  };
};
