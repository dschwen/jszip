function Storage(defaults) {
  var CLIENT_ID = '961409091716-f13l7n45n8u0uvkjqc9vjjddndd40jgs.apps.googleusercontent.com'
    , SCOPES = 'https://www.googleapis.com/auth/drive'
    , ls = window.localStorage || null
    , gAPICallback = 'storage_googleAPILoaded'
    , $dialog, dsave = null;
  
  // default options and option fill-in-from-defaults method
  defaults = defaults || {};
  function augment(a,b) {
    for (k in b) {
      if (b.hasOwnProperty(k) && !(k in a)) { a[k] = b[k]; }
    }
  }
  augment(defaults, { basename: 'file' });

  /* options
    
    { 
      local: 'keyname',
      server: [ list of server URLs for open only ],
      callback:  function(saved)   saved=true on success, saved=false on user abort
      error:     function(error)   called for save errors 
              || undefined         (just call callback(false))
      basename: dialog title and default filename
      extension: (list for open)
    }
  */

  function buildDialog() {
    $dialog = $('<div class="storage-dialog"></div>');
    $dialog.append($('<h1><span class="save-open"></span> <span class="title"></span>&hellip;</h1>'));

    $('<button class="save-open"></button>').appendTo($dialog);
    $dialog.appendTo('body').hide()
  }

  function save(options) {
    augment(options,defaults);
    // condition dialog
    $('.save-open',$dialog).text('Save');
    $('.to-from',$dialog).text('to');
    $('.title',$dialog).text(options.basename);
  }

  function open(options) {
    augment(options,defaults);
    // condition dialog
    $('.save-open').text('Open');
    $('.to-from',$dialog).text('from');
    $('.title',$dialog).text(options.basename);
  }

  function fillDriveSelect() {
    $('<div></div>').text(JSON.stringify(dsave)).appendTo($('body'));
  }

  function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
      // Access token has been successfully retrieved, requests can be sent to the API.
      $('.option.drive',$dialog).show();
      $('.option.auth',$dialog).hide();
      // fetch list of files
      gapi.client.load('drive', 'v2', function() {
        console.log("Google Drive API loaded.");
        retrieveAllFiles();
      });
    } else {
      $('.option.auth button').click(function() {
        gapi.auth.authorize( {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false}, handleAuthResult);
      });
    }
  }

  function retrieveAllFiles() {
    var retrievePageOfFiles = function(request, result) {
      request.execute(function(resp) {
        result = result.concat(resp.items);
        var nextPageToken = resp.nextPageToken, num, suf;
        if (nextPageToken) {
          request = gapi.client.drive.files.list({'pageToken': nextPageToken });
          retrievePageOfFiles(request, result);
        } else {
          // retrieved result, build dsave list of eligible files that are not in trash
          dsave = {};
          for (var i=0; i<result.length; ++i ) {
            if (result[i].mimeType == 'application/octet-stream' &&
                result[i].labels.trashed == false) {
              dsave[result[i].id] = result[i];
            }
          }
          fillDriveSelect('#savedriveoldname');
          //fillDriveSelect('#restoredriveoldname');
        }
      });
    }
    var initialRequest = gapi.client.drive.files.list();
    retrievePageOfFiles(initialRequest, []);
  }
  
  $('body').append($('<div id="google_signin_button"></div>'));

  // load Google API
  if (!(gAPICallback in window)) {
    window[gAPICallback] = function(){
      var options = {
        'callback' : handleAuthResult,
        'clientid' : CLIENT_ID,
        'scope': SCOPES,
        'cookiepolicy' : 'single_host_origin'
      };

      gapi.signin.render('google_signin_button', options);
    }
    $('<script></script').appendTo('body').attr('src','https://apis.google.com/js/client:platform.js?onload='+gAPICallback);
  }

  return {
    save: save,
    open: open
  };
}

/*
<div class="dialog" id="savedialog">
  <h1>Save game&hellip;</h1>
  <div class="localsave">
    <h2>&hellip;on this browser</h2>
    <div class="option">
      <input type="radio" name="savetype" value="localnew" checked/>
      <input type="text" id="savelocalnewname" placeholder="New File"/>
      <br/>
      <div class="haslocal">
      <input type="radio" name="savetype" value="localold"/>
      <select id="savelocaloldname">
      <option>Loading...</option>
      </select>
      </div>
      <br/>
      <button>Save</button>
    </div>
  </div>
  <div class="filesave">
    <h2>&hellip;on this computer</h2>
    <div class="option">
      <a download="save.sav" id="downloadsave" href="">Download save file&hellip;</a>
    </div>
  </div>
  <div class="drivesave">
    <h2>&hellip;on Google Drive</h2>
    <div class="option drive">
      <input type="radio" name="savetype" value="drivenew" checked/>
      <input type="text" id="savedrivenewname" placeholder="New File"/>
      <br/>
      <div class="hasdrive">
      <input type="radio" name="savetype" value="driveold"/>
      <select id="savedriveoldname">
      <option>Loading...</option>
      </select>
      </div>
      <br/>
      <button>Save</button>
    </div>
    <div class="option auth">
      <button class="signin">Sign in with Google</button>
    </div>
  </div>
</div>

<div class="dialog" id="restoredialog">
  <h1>Restore game&hellip;</h1>
  <div class="localrestore haslocal">
    <h2>&hellip;from this browser</h2>
    <div class="option">
      <select id="restorelocaloldname">
      <option>Loading...</option>
      </select>
      <br/>
      <button>Restore</button>
    </div>
  </div>
  <div class="filerestore">
    <h2>&hellip;from this computer</h2>
    <div class="option">
      <input type="file" id="uploadfile"/>
      <br/>
      <button>Restore</button>
    </div>
  </div>
  <div class="driverestore hasdrive">
    <h2>&hellip;from Google Drive</h2>
    <div class="option drive">
      <select id="restoredriveoldname">
      <option>Loading...</option>
      </select>
      <button>Restore</button>
    </div>
    <div class="option auth">
      <button class="signin">Sign in with Google</button>
    </div>
  </div>
</div>

  // get saves from localStorage
  if (ls) {
    lsave = JSON.parse(ls.getItem('jszipSaves')||'{}');
  } else {
    $('.localsave').hide();
  }

  function fillFileSelect(s) {
    var g,$s=$(s),n=true;
    $s.empty();
    for (g in lsave) {
      if (lsave.hasOwnProperty(g)) {
        $s.append($('<option></option>').text(g).attr('value',g));
        n=false;
      }
    }
    if (n) { $('.haslocal').hide() }
    else   { $('.haslocal').show() }
  }
  function fillDriveSelect(s) {
    if (dsave===null) { return; }

    var g,$s=$(s),n=true;
    $s.empty();
    for (g in dsave) {
      if (dsave.hasOwnProperty(g)) {
        $s.append($('<option></option>').text(dsave[g].title).attr('value',g));
        n=false;
      }
    }
    if (n) { $('.hasdrive').hide() }
    else  { $('.hasdrive').show() }
  }
  function saveLocal() {
    var name, mode = $('#savedialog input[type=radio]:checked').val();
    if (mode=='localnew') {
      name = $('#savelocalnewname').val();
    } else if (mode=='localold') {
      name = $('#savelocaloldname').val();
    } else {
      return;
    }
    // empty name
    if (name=='') return;
    // save to localstorage
    lsave[name] = btoa(saveGame);
    ls.setItem('jszipSaves',JSON.stringify(lsave));
    // get back into game
    $save.fadeOut();
    step();
  }
  function restoreLocal() {
    var e=restoreOpts, name = $('#restorelocaloldname').val();
    if (e==null) {
      throw Error('No z_restore options available!');
    }
    FS.createDataFile('/', 'save.sav', atob(lsave[name]), true, true);
    restoreOpts=null;
    $restore.fadeOut();
    zRestore(e.count,e.o0,e.o1,e.o2);
    step();
  }
  function saveDrive() {
    var id=null, name, mode = $('#savedialog input[type=radio]:checked').val(), method;
    if (mode=='drivenew') {
      name = $('#savedrivenewname').val();
      if (name=='') return;
    } else if (mode=='driveold') {
      id = $('#savedriveoldname').val();
      if (dsave===null || !(id in dsave)) return;
      name = dsave[id].title;
    } else {
      return;
    }

    // save to Google Drive
    var boundary = '-------314159265358979323846'
      , delimiter = "\r\n--" + boundary + "\r\n"
      , close_delim = "\r\n--" + boundary + "--"
      , metadate
      , base64Data = btoa(saveGame);
    
    // specify original metadata and use method 'PUT' to allow update of existing file
    if (id) {
      metadata = dsave[id];
      id='/'+id; // append /id to xhr url causes an update of an existing file
      method='PUT';
    } else {
      metadata = {
        'title': name,
        'mimeType': 'application/octet-stream'
      };
      id='';
      method='POST';
    }

    var multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/octet-stream\r\n' +
          'Content-Transfer-Encoding: base64\r\n' +
          '\r\n' +
          base64Data +
          close_delim
      , request = gapi.client.request({
          'path': '/upload/drive/v2/files'+id,
          'method': method, 'alt': 'json',
          'params': {'uploadType': 'multipart', 'alt': 'json'},
          'headers': { 'Content-Type': 'multipart/mixed; boundary="' + boundary + '"' },
          'body': multipartRequestBody
        });

    request.execute(function(e){
      // refresh the file lists
      retrieveAllFiles();
      // get back into game
      $save.fadeOut();
      step();
    });
  }
  function restoreDrive() {
    var e=restoreOpts, id = $('#restoredriveoldname').val();
    if (e==null) {
      throw Error('No z_restore options available!');
    }
    if (dsave===null || !(id in dsave)) { return; }
    downloadDriveFile(id);
  }
  function restoreFile(fl) {
    if (fl.length!=1) { return; }
    var f=fl[0];

    // instantiate a new FileReader
    var reader = new FileReader();
    reader.onload=function(e) {
      FS.createDataFile('/', 'save.sav', e.target.result, true, true);
      restoreOpts=null;
      $restore.fadeOut();
      zRestore(e.count,e.o0,e.o1,e.o2);
      FS.unlink('save.sav');
      step();
    }
    reader.readAsBinaryString(f);
  }
  
  function downloadDriveFile(id) {
    var accessToken = gapi.auth.getToken().access_token
      , url = dsave[id].downloadUrl
      , e=restoreOpts
      , xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      if (xhr.status == 200) {
        FS.createDataFile('/', 'save.sav', new Uint8Array(xhr.response), true, true);
        restoreOpts=null;
        $restore.fadeOut();
        zRestore(e.count,e.o0,e.o1,e.o2);
        FS.unlink('save.sav');
      } else {
        error("Google Drive returned an error: " + xhr.statusText );
      }
      step();
    };
    xhr.onerror = function() {
      // should probably report an error first
      error("Error fetching file from Google Drive.");
      $restore.fadeOut();
      step(); 
    };
    xhr.send();
  }

*/
