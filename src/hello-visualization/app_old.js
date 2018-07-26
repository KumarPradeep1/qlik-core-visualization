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
      app.getField('Movie').then((field) => {
        field.select(value).then(() => {
          $scope.dataSelected = true;
          this.getMovieInfo().then(() => {
            $scope.showFooter = true;
          });
        });
      });
    };

    const scatterplotProperties = {
      qInfo: {
        qType: 'visualization',
        qId: '',
      },
      type: 'my-picasso-scatterplot',
      labels: true,
      qHyperCubeDef: {
        qDimensions: [{
          qDef: {
            qFieldDefs: ['rowid'],
            qSortCriterias: [{
              qSortByAscii: 1,
            }],
          },
        }],
        qMeasures: [{
          qDef: {
            qDef: '[rowid]',
            qLabel: 'Adjusted cost ($)',
          },
          qSortBy: {
            qSortByNumeric: -1,
          },
        },
        {
          qDef: {
            qDef: '[rowid]',
            qLabel: 'imdb rating',
          },
        }],
        qInitialDataFetch: [{
          qTop: 0, qHeight: 50, qLeft: 0, qWidth: 3,
        }],
        qSuppressZero: false,
        qSuppressMissing: true,
      },
    }; 
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

    this.$onInit = () => {
      const config = {
        Promise: $q,
        schema: qixSchema,
        mixins: enigmaMixin,
        url: `ws://${window.location.hostname}:19067/app/${this.generateGUID()}`,
      }; 
      const filePathAirport = '/data/qlik_airport.csv';
      const tableAirport = new Halyard.Table(filePathAirport, {
        name: 'Airport',
        fields: [{ src: 'rowid', name: 'rowid' },
                  { src: 'airport', name: 'airport' },
                  { src: 'city', name: 'city' }, 
                  { src: 'country', name: 'country' },
                  { src: 'iatacode', name: 'iatacode' }],
        delimiter: ',',
      });
     halyard.addTable(tableAirport);
      // Add local data
      const filePathMovie = '/data/movies.csv';
      const tableMovie = new Halyard.Table(filePathMovie, {
        name: 'Movies',
        fields: [{ src: 'Movie', name: 'Movie' }, 
              { src: 'Year', name: 'Year' },
              { src: 'Adjusted Costs', name: 'Adjusted Costs' },
              { src: 'Description', name: 'Description' },
              { src: 'Image', name: 'Image' }],
        delimiter: ',',
      });
       //halyard.addTable(tableMovie);
       
      // Add web data
      $http.get('http://localhost:8580/getData')
        .then((data) => {
          const table = new Halyard.Table(data.data, { name: 'MoviesInfos', delimiter: ',', characterSet: 'utf8' });
          console.log(table);
          halyard.addTable(table);
        })
        .then(() => {
          enigma.create(config).open().then((qix) => {
            this.connected = true;
            this.connecting = false;
            qix.createSessionAppUsingHalyard(halyard).then((result) => {
              app = result;
              result.getAppLayout()
                .then(() => {
                  console.log(scatterplotProperties)
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
        });
    };

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
              qFieldDefs: ['rowid'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['airport'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['city'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['country'],
            },
          },
          {
            qDef: {
              qFieldDefs: ['iatacode'],
            },
          },
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
