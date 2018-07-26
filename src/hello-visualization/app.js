/* eslint-env browser */

import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import template from './app.html';
import Scatterplot from './scatterplot';
import Linechart from './linechart';

const halyard = new Halyard();

angular.module('app', []).component('app', {
  bindings: {},
  controller: ['$scope', '$q', '$http', function Controller($scope, $q, $http) {
    $scope.dataSelected = false;
    $scope.showFooter = false;

    $scope.toggleFooter = () => {
      $scope.showFooter = !$scope.showFooter;
      if (!$scope.showFooter && $scope.dataSelected) {
        this.clearAllSelections();
      }
    };

    $scope.openGithub = () => {
      window.open('https://github.com/qlik-oss/core-get-started');
    };

    this.connected = false;
    this.painted = false;
    this.connecting = true;

    let app = null;
    let scatterplotObject = null;
    let linechartObject = null;

    const select = (value) => {
      app.getField('title').then((field) => {
        field.select(value).then(() => {
          $scope.dataSelected = true;
          this.getMovieInfo().then(() => {
            $scope.showFooter = true;
          });
        });
      });
    };
    $scope.plotProperties = (qFieldDefs,qMeasures_x,qMeasures_y) => { 
      return {
        qInfo: {
          qType: 'visualization',
          qId: '',
        },
        type: 'my-picasso-scatterplot',
        labels: true,
        qHyperCubeDef: {
          qDimensions: [{
            qDef: {
              qFieldDefs: [qFieldDefs],
              qSortCriterias: [{
                qSortByAscii: 1,
              }],
            },
          }],
          qMeasures: [{
            qDef: {
              qDef: '['+qMeasures_x+']',
              qLabel: 'Rank',
            },
            qSortBy: {
              qSortByNumeric: -1,
            },
          },
          {
            qDef: {
              qDef: '['+qMeasures_y+']',
              qLabel: 'Rank',
            },
          }],
          qInitialDataFetch: [{
            qTop: 0, qHeight: 50, qLeft: 0, qWidth: 3,
          }],
          qSuppressZero: false,
          qSuppressMissing: true,
        },
      };
  };

  $scope.loadplotProperties =  (scatterplotProperties,delimiter,theadobj,data) => { 
    const scatterplot = new Scatterplot(); 
    const paintScatterPlot = (layout) => {
      scatterplot.paintScatterplot(document.getElementById('chart-container-scatterplot'), layout, {
        select,
        clear: () => this.clearAllSelections(),
        hasSelected: $scope.dataSelected,
      });
      this.painted = true;
    };
    this.generateGUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { 
      const r = Math.random() * 16 | 0; 
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    }); 
    const config = {
      Promise: $q,
      schema: qixSchema,
      mixins: enigmaMixin,
      url: `ws://${window.location.hostname}:19076/app/${this.generateGUID()}`,
    }; 

        const tableAirport = new Halyard.Table(data, {
          name: 'Airport',
          fields: theadobj,
          delimiter: delimiter,
        });
        halyard.addTable(tableAirport);  
        const table = new Halyard.Table(data, { name: 'MoviesInfos', delimiter: delimiter, characterSet: 'utf8' }); 
        halyard.addTable(table);
        enigma.create(config).open().then((qix) => {
          this.connected = true;
          this.connecting = false; 
          qix.createSessionAppUsingHalyard(halyard).then((result) => {
            app = result;
            result.getAppLayout()
              .then(() => { 
                result.createSessionObject(scatterplotProperties).then((model) => {
                  scatterplotObject = model; 
                  const update = () => scatterplotObject.getLayout().then((layout) => { 
                    paintScatterPlot(layout);
                  });

                  scatterplotObject.on('changed', update);
                  update();
                }); 
              });
          }, () => {
            this.error = 'Could not create session app';
            this.connected = false;
            this.connecting = false;
          });
        }, () => {
          this.error = 'Could not connect to QIX Engine';
          this.connecting = false;
        });
  };

  $http.get('http://localhost:8580/getData')
    .then((data) => {
      let response = data.data;
      const scatterplots = $scope.plotProperties(response.qFieldDefs,response.qMeasures_x,response.qMeasures_y);    
      const tableheader = response.tablehead;
      let theadobj = []; 
      tableheader.map((thead,index)=>{
        if(index < 5){ // Get 5 Datas Only
          theadobj.push({src:thead,name:thead});  
        }
      }); 
      $scope.loadplotProperties(scatterplots,response.delimiter,theadobj,response.data);
  }); 
  
    this.clearAllSelections = () => {
      if ($scope.dataSelected) {
        $scope.dataSelected = false;
        app.clearAll();
      }
      $scope.showFooter = false;
    }; 
    this.getMovieInfo = () => { 
      const tableProperties = {
        qInfo: {
          qType: 'visualization',
          qId: '',
        },
        type: 'my-info-table',
        labels: true,
        qHyperCubeDef: {
          qDimensions: [
          {
            qDef: {
              qFieldDefs: ['category'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['period'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['rank'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['title'],
            },
          },{
            qDef: {
              qFieldDefs: ['asin'],
            },
          }
          ],
          qInitialDataFetch: [{
            qTop: 0, qHeight: 50, qLeft: 0, qWidth: 50,
          }],
          qSuppressZero: false,
          qSuppressMissing: true,
        },
      };
      return app.createSessionObject(tableProperties)
        .then(model => model.getLayout()
          .then((layout) => {
            Scatterplot.showDetails(layout);
          }));
    };
  }],
  template,
});

angular.bootstrap(document, ['app']);
