function Storage(defaults) {
  var ls = window.localStorage || null
    , gAPICallback = 'storage_googleAPILoaded'
    , $dialog=$('#storagedialog')
    , dsave = null
    , driveFilesCallback = null
    , lsave = {};

  // default options and option fill-in-from-defaults method
  defaults = defaults || {};
  function augment(a,b) {
    a=a||{};
    for (k in b) {
      if (b.hasOwnProperty(k) && !(k in a)) { a[k] = b[k]; }
    }
  }
  augment(defaults, { basename: 'file', binary: true, data: '' });

  var handler = {
    local: null,
    file: null,
    drive: null,
    server: null
  }

  function run(action) {
    if (handler[action]) {
      $('button',$dialog).attr('disabled','disabled');
      handler[action]();
    }
  }

  // hook up buttons
  $('.local button',$dialog).on('click', function() { run('local'); });
  $('.file button',$dialog).on('click', function() { run('file'); });
  $('.drive button',$dialog).on('click', function() { run('drive'); });
  $('.server button',$dialog).on('click', function() { run('server'); });
  $('.file a.downloadlink',$dialog).on('click', function() { run('download'); });

  // select/input behaviour
  $('.local select',$dialog).on('change', function() { $('.local input',$dialog).val('')});
  $('.local input',$dialog).on('keydown', function() { $('.local option.null').attr('selected', 'selected'); } );
  $('.drive select',$dialog).on('change', function() { $('.drive input',$dialog).val('')});
  $('.drive input',$dialog).on('keydown', function() { $('.drive option.null').attr('selected', 'selected'); } );

  /* options

    {
      binary: true,
      local: 'keyname',
      server: [ list of server URLs for open only ],
      callback:  function(file)   file=data or true on success, file===false on user abort
      error:     function(error)   called for save errors
              || undefined         (just call callback(false))
      basename: dialog title and default filename
      extension: (list for open)
      data: file data for saving
    }
  */

  function common(options) {
    // insert the basename in the dialog text
    $('.basename',$dialog).text(options.basename || 'file');

    // local files
    if (ls!==null && options.local) {
      lsave = JSON.parse(ls.getItem(options.local)||'{}');
      fillLocalSelect(options.pattern||'');
      $('.local',$dialog).show();
    } else {
      $('.local',$dialog).hide();
    }

    // drive
    driveFilesCallback = function() { // in case we have an ongoing login process
      fillDriveSelect(options.pattern||'');
    }
    handler.refresh = retrieveAllFiles; // manual refresh
    fillDriveSelect(options.pattern||''); // populate select with cached dsave data now

    // pattern
    $('input[type=text]',$dialog).attr('pattern',options.pattern||'');

    // enable buttons
    $('button',$dialog).removeAttr('disabled');

    // show dialog
    $dialog.fadeIn();
  }

  function save(options) {
    options = options || {};
    augment(options,defaults);

    function callback(success,msg) {
      $dialog.fadeOut();
      if (options.callback) options.callback(success,msg);
    }

    // process save data (handles strings, arrays of numbers, Uint8Arrays etc.)
    var stringified, base64Data, l, data=options.data;
    if (data.length===undefined || data.length===0) {
      callback(false,"Empty or unknown data type.");
      return;
    }
    if (typeof data === 'string') {
      stringified = data;
    } else if (typeof data[0] === 'number') {
      stringified = '';
      l = data.length;
      for (i=0;i<l;++i) {
        stringified += String.fromCharCode(data[i]);
      }
    } else {
      callback(false,"Unknown options.data type in Storage.");
      return;
    }
    base64Data = btoa(stringified);

    // save in localStorage
    function local() {
      var name = $('.local select',this.$dialog).val() || $('.local input',this.$dialog).val();
      // empty name
      if (name=='') {
        callback(false);
        return;
      }
      // save to localstorage
      lsave[name] = base64Data;
      ls.setItem(options.local,JSON.stringify(lsave));
      callback(true);
    }

    // save on Google Drive
    function drive() {
      var id = $('.drive select',$dialog).val() || null
        , name = $('.drive input',$dialog).val()
        , boundary = '-------314159265358979323846'
        , delimiter = "\r\n--" + boundary + "\r\n"
        , close_delim = "\r\n--" + boundary + "--"
        , metadata;

      if (id === null) {
        if (name=='') {
          callback(false);
          return;
        }
      } else {
        if (dsave===null || !(id in dsave)) {
          callback(false);
          return;
        }
        name = dsave[id].title;
      }

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
        // refresh the dsave cache (file list)
        driveFilesCallback = null; // no need to perform any further action
        retrieveAllFiles();
        callback(true,"Save complete.");
        return;
      });
    }

    // condition dialog
    common(options);
    $('.open',$dialog).hide();
    $('.save',$dialog).show();
    $('.null',$dialog).removeAttr('disabled');

    // prepare downloadlink
    handler.download = function(e) {
       $('.file a.downloadlink',$dialog).attr('href','data:application/octet-stream;base64,'+base64Data);
    }

    // handlers
    handler.local = local;
    handler.file = null;
    handler.drive = drive;
    handler.server = null;
  }

  function open(options) {
    options = options || {};
    augment(options,defaults);

    function callback(data) {
      $dialog.fadeOut();
      if (options.binary===false) {
        var stringified = '', l = data.length;
        for (i=0;i<l;++i) {
          stringified += String.fromCharCode(data[i]);
        }
        data = stringified;
      }
      if (options.callback) options.callback(data);
    }

    function local() {
      var name = $('.local select').val();
      if (name in lsave) {
        callback(atob(lsave[name]));
        return;
      } else {
        callback(null);
        return;
      }

      /*
      function(data) {
        var e=restoreOpts,
        if (e==null) {
          throw Error('No z_restore options available!');
        }
        FS.createDataFile('/', 'save.sav', data, true, true);
        restoreOpts=null;
        zRestore(e.count,e.o0,e.o1,e.o2);
        FS.unlink('save.sav');
        step();
      }
      */
    }

    function file() {
      fl = $('.file input[type=file]',$dialog)[0].files;
      if (fl.length!==1) {
        callback(null);
        return;
      }
      var f=fl[0];

      // instantiate a new FileReader
      var reader = new FileReader();
      reader.onload=function(e) {
        callback(e.target.result);
        return;
      }
      reader.readAsBinaryString(f);
    }

    function drive() {
      var id = $('.drive select').val()
        , accessToken = gapi.auth.getToken().access_token
        , url = dsave[id].downloadUrl
        , xhr = new XMLHttpRequest();

      if (dsave===null || !(id in dsave)) {
        callback(null);
        return;
      }

      xhr.open('GET', url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status == 200) {
          callback(new Uint8Array(xhr.response));
          return;
        } else {
          callback(null);
          return;
        }
      };
      xhr.onerror = function() {
        callback(null);
        return;
      };
      xhr.send();
    }

    function fillServerSelect() {
      var g,$s=$('.server select',$dialog).empty();
      for (g in options.server) {
        if (options.server.hasOwnProperty(g)) {
          $s.append($('<option></option>').text(options.server[g]).attr('value',g));
        }
      }
    }

    function server() {
      var url = $('.server select').val()
        , xhr = new XMLHttpRequest();

      if (!(url in options.server)) {
        callback(null);
        return;
      }
      xhr.open('GET', url);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status == 200) {
          callback(new Uint8Array(xhr.response));
          return;
        } else {
          callback(null);
          return;
        }
      };
      xhr.onerror = function() {
        callback(null);
        return;
      };
      xhr.send();
    }

    // condition dialog
    common(options);
    $('.open',$dialog).show();
    $('.save',$dialog).hide()
    $('.null',$dialog).attr('disabled','disabled');

    // server
    if (!('server' in options)) {
      $('.server',$dialog).hide();
      handler.server = null;
    } else {
      fillServerSelect(options.pattern||'');
      $('.server',$dialog).show();
      handler.server = server;
    }

    // handlers
    handler.download = null;
    handler.local = local;
    handler.file = file;
    handler.drive = drive;

  }

  function onSignIn(authResult) {
    if (authResult && !authResult.error) {
      // Access token has been successfully retrieved, requests can be sent to the API.
      $('.signedin',$dialog).show();
      $('.signedout',$dialog).hide();
      // fetch list of files
      gapi.client.load('drive', 'v2', function() {
        console.log("Google Drive API loaded.");
        retrieveAllFiles();
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
          // a dialog may have requested an update as soon as the dsave list is retrieved
          if (driveFilesCallback) driveFilesCallback();
        }
      });
    }
    var initialRequest = gapi.client.drive.files.list();
    retrievePageOfFiles(initialRequest, []);
  }

  function fillLocalSelect(pattern) {
    var g,$s=$('.local optgroup',$dialog),nofiles=true
      , regexp = new RegExp(pattern)
      , prev = $s.parent().val();

    $s.empty();
    for (g in lsave) {
      if (lsave.hasOwnProperty(g) && regexp.test(g)) {
        if(!prev) { prev=g; }
        $s.append($('<option></option>').text(g).attr('value',g));
        n=false;
      }
    }

    if (nofiles) {
      $('.local .hasfiles',$dialog).hide();
    } else {
      $('.local .hasfiles',$dialog).show();
      $s.parent().val(prev);
    }
  }

  function fillDriveSelect(pattern) {
    if (dsave===null) { return; }

    var g,$s=$('.drive optgroup',$dialog),nofiles=true
      , regexp = new RegExp(pattern)
      , prev = $s.parent().val();

    $s.empty();
    for (g in dsave) {
      if (dsave.hasOwnProperty(g) && regexp.test(dsave[g].title)) {
        if(!prev) { prev=g; }
        $s.append($('<option></option>').text(dsave[g].title).attr('value',g));
        nofiles=false;
      }
    }

    if (nofiles) {
      $('.drive .hasfiles',$dialog).hide()
    } else {
      $('.drive .hasfiles',$dialog).show()
      $s.parent().val(prev);
    }

    return nofiles;
  }


  // $('.signedout',$dialog).append($('<div id="google_signin_button"></div>'));
  // $('.open',$dialog).hide();
  //
  // // load Google API
  // if (!(gAPICallback in window)) {
  //   window[gAPICallback] = function(){
  //     var options = {
  //       'callback' : handleAuthResult,
  //       'clientid' : CLIENT_ID,
  //       'scope': SCOPES,
  //       'cookiepolicy' : 'single_host_origin'
  //     };
  //
  //     gapi.signin.render('google_signin_button', options);
  //   }
  //   $('<script></script').appendTo('body').attr('src','https://apis.google.com/js/client:platform.js?onload='+gAPICallback);
  // }

  return {
    save: save,
    open: open,
    onSignIn: onSignIn
  };
}
