function Storage(defaults) {
  var CLIENT_ID = '961409091716-f13l7n45n8u0uvkjqc9vjjddndd40jgs.apps.googleusercontent.com'
    , SCOPES = 'https://www.googleapis.com/auth/drive'
    , ls = window.localStorage || null
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
  augment(defaults, { basename: 'file', binary: true });

  var handler = {
    local: null,
    file: null,
    drive: null,
    server: null
  }

  // hook up buttons
  $('.local button',$dialog).on('click', function(e) { if(handler.local) handler.local(e) });
  $('.file button',$dialog).on('click', function(e) { if(handler.file) handler.file(e) });
  $('.drive button',$dialog).on('click', function(e) { if(handler.drive) handler.drive(e) });
  $('.server button',$dialog).on('click', function(e) { if(handler.server) handler.server(e) });
  $('.file a.downloadlink',$dialog).on('click', function(e) { if(handler.download) handler.download(e) });

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

    // server
    if (!('server' in options)) {
      $('.server',$dialog).hide();
    } else {
      $('.server',$dialog).show();
    }
  }

  function save(options) {
    options = options || {};
    augment(options,defaults);

    function callback() {
      $dialog.fadeOut();
      if (options.callback) options.callback();
    }

    function local() {
      var name = $('.local select',this.$dialog).val() || $('.local input',this.$dialog).val();
      // empty name
      if (name=='') return;
      // save to localstorage
      lsave[name] = btoa(options.data||'');
      ls.setItem(options.local,JSON.stringify(lsave));
      // get back into game
      callback();
      //step();
    }

    function drive() {
      var id = $('.drive select',$dialog).val() || null
        , name = $('.drive input',$dialog).val();
      if (id !== null) {
        if (name=='') return;
      } else {
        if (dsave===null || !(id in dsave)) return;
        name = dsave[id].title;
      } 

      // save to Google Drive
      var boundary = '-------314159265358979323846'
        , delimiter = "\r\n--" + boundary + "\r\n"
        , close_delim = "\r\n--" + boundary + "--"
        , metadate
        , base64Data = btoa(options.data||'');
      
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
        callback();
      });
    }

    // condition dialog
    common(options);
    $('.open',$dialog).hide(); 
    $('.save',$dialog).show(); 
    $dialog.fadeIn();
  
    // prepare downloadlink
    handler.download = function(e) {
      var a = window.btoa(options.data);
       $('.file a.downloadlink',$dialog).attr('href','data:application/octet-stream;base64,'+a);
    }
    
    // handlers
    handler.local = local;
    handler.drive = drive;
    handler.file = null;
  }

  function open(options) {
    options = options || {};
    augment(options,defaults);

    function callback(data) {
      $dialog.fadeOut();
      if (options.callback) options.callback(data);
    }

    function local() {
      var name = $('#restorelocaloldname').val();
      callback(atob(lsave[name]));

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
      if (fl.length!==1) { return; }
      var f=fl[0];

      // instantiate a new FileReader
      var reader = new FileReader();
      reader.onload=function(e) {
        callback(e.target.result);
      }
      reader.readAsBinaryString(f);
    }

    function drive() {
      var id = $('.drive select').val()
        , accessToken = gapi.auth.getToken().access_token
        , url = dsave[id].downloadUrl
        , e=restoreOpts
        , xhr = new XMLHttpRequest();

      if (dsave===null || !(id in dsave)) { return; }

      xhr.open('GET', url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function() {
        if (xhr.status == 200) {
          callback(new Uint8Array(xhr.response));
        } else {
          callback(null));
        }
      };
      xhr.onerror = function() {
        callback(null);
      };
      xhr.send();
    }

    // condition dialog
    common(options);
    $('.open',$dialog).show(); 
    $('.save',$dialog).hide()

    // file upload / downloadlink
    handler.download = null;
    handler.file = file;

    // button for local save
    handler.local = local;

  }

  function handleAuthResult(authResult) {
    if (authResult && !authResult.error) {
      // Access token has been successfully retrieved, requests can be sent to the API.
      $('.signedin',$dialog).show();
      $('.signedout',$dialog).hide();
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
      , regexp = new RegExp(pattern);

    $s.empty();
    for (g in lsave) {
      if (lsave.hasOwnProperty(g) && regexp.test(g)) {
        $s.append($('<option></option>').text(g).attr('value',g));
        n=false;
      }
    }

    if (nofiles) {
      $('.file .hasfiles',$dialog).hide() 
    } else { 
      $('.file .hasfiles',$dialog).show() 
    }
  }

  function fillDriveSelect(pattern) {
    if (dsave===null) { return; }

    var g,$s=$('.drive optgroup',$dialog),nofiles=true
      , regexp = new RegExp(pattern);

    $s.empty();
    for (g in dsave) {
      if (dsave.hasOwnProperty(g) && regexp.test(dsave[g].title)) {
        $s.append($('<option></option>').text(dsave[g].title).attr('value',g));
        nofiles=false;
      }
    }
    
    if (nofiles) { 
      $('.drive .hasfiles',$dialog).hide() 
    } else { 
      $('.drive .hasfiles',$dialog).show() 
    }

    return nofiles;
  }


  $('.signedout',$dialog).append($('<div id="google_signin_button"></div>'));
  $('.open',$dialog).hide();

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

  // get saves from localStorage
  if (ls) {
    lsave = JSON.parse(ls.getItem('jszipSaves')||'{}');
  } else {
    $('.localsave').hide();
  }


*/
