/* Copyright 2015 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

'use strict';

var log = require('server/util/log');

// Basic server management hooks.
// This is just for demonstration purposes, since the real server
// will not have the ability to listen over http.
class Control {
  constructor(moduleManager, playlistLoader) {
    this.layoutSM = moduleManager.getLayoutSM();
    this.playlistLoader = playlistLoader;

    this.initialConfig = playlistLoader.getInitialPlaylistConfig();
    this.currentConfig = this.initialConfig;
  }

  installHandlers(app) {
    app.get('/api/playlist', this.getPlaylist.bind(this));
    app.get('/api/config', this.getConfig.bind(this));
    app.get('/api/errors', this.getErrors.bind(this));
    app.post('/api/config', this.setConfig.bind(this));
    app.get('/api/layout', this.getLayout.bind(this));
    app.get('/api/clients', this.getClientState.bind(this));
    app.post('/api/skip', this.skip.bind(this));
    app.post('/api/play', this.playModule.bind(this));
  }

  getConfig(req, res) {
    res.json({
      initial: this.initialConfig,
      current: this.currentConfig,
    });
  }

  getErrors(req, res) {
    res.json(log.getRecentErrors());
  }

  setConfig(req, res) {
    try {
      var json = this.playlistLoader.parseJson(req.body.config);
      var playlistConfig = this.playlistLoader.parsePlaylist(json);
    } catch (e) {
      res.status(400).send('Bad request: ' + e);
      return;
    }
    this.layoutSM.setPlaylist(playlistConfig);
    this.currentConfig = json;
    res.redirect('/status');
  }

  getPlaylist(req, res) {
    res.json(this.layoutSM.getPlaylist());
  }

  getClientState(req, res) {
    res.json(this.layoutSM.getClientState());
  }

  getLayout(req, res) {
    res.json(this.layoutSM.getLayout());
  }

  skip(req, res) {
    this.layoutSM.skipAhead();
  }

  playModule(req, res) {
    var moduleName = req.query.module;
    if (!moduleName) {
      res.status(400).send('Expected module parameter');
      return;
    }
    if (!this.layoutSM.playModule(moduleName)) {
      // TODO: distinguish between "module not found" and "unable to enqueue".
      res.status(400).send('Unable to play module');
      return;
    }
    res.send('Enqueued');
  }
}

module.exports = Control;
