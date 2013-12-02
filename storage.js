function Storage(template,defaults) {
  var CLIENT_ID = '961409091716-f13l7n45n8u0uvkjqc9vjjddndd40jgs.apps.googleusercontent.com'
    , SCOPES = 'https://www.googleapis.com/auth/drive'
    , ls = window.localStorage || null
    , gAPICallback = 'storage_googleAPILoaded'
    , $dialog, dsave = null;
  
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

  $dialog = template.clone();

  // hook up buttons
  $('.local button',$dialog).on('click', function() { if(handler.local) handler.local() });
  $('.file button',$dialog).on('click', function() { if(handler.file) handler.file() });
  $('.drive button',$dialog).on('click', function() { if(handler.drive) handler.drive() });
  $('.server button',$dialog).on('click', function() { if(handler.server) handler.server() });

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
    $('.basename',$dialog).text(options.basename);

    // local files
    if (ls===null || !('local' in options)) {
      $('.local',$dialog).hide();
    } else {
      $('.local',$dialog).show();
    }

    // server
    if (!('server' in options)) {
      $('.server',$dialog).hide();
    } else {
      $('.server',$dialog).show();
    }

    // actualCallback
    options.actualCallback = function() {
      $dialog.fadeOut();
      if (options.callback) options.callback();
    }
  }

  function save(options) {
    augment(options,defaults);
    // condition dialog
    common(options);
    $('.open',$dialog).hide(); 
    $('.save',$dialog).show(); 
  
    // prepare downloadlink
    $('.downloadlink',$dialog).on('click', function() {
      var a = window.btoa(options.data)
      $(this).attr('href','data:application/octet-stream;base64,'+a);
    });

    // button for local save
    $('.local button',$dialog).on('click',function() {
    });
  }

  function open(options) {
    augment(options,defaults);
    // condition dialog
    $('.open',$dialog).show(); 
    $('.save',$dialog).hide()
    $('.file',$dialog).text(options.basename);
  }

  function fillDriveSelect() {
    $('<div></div>').text(JSON.stringify(dsave)).appendTo($('body'));
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
          fillDriveSelect('#savedriveoldname');
          //fillDriveSelect('#restoredriveoldname');
        }
      });
    }
    var initialRequest = gapi.client.drive.files.list();
    retrievePageOfFiles(initialRequest, []);
  }

  function fillFileSelect() {
    var g,$s=$('.file optgroup',$dialog),n=true;
    $s.empty();
    for (g in lsave) {
      if (lsave.hasOwnProperty(g)) {
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
  function fillDriveSelect() {
    if (dsave===null) { return; }

    var g,$s=$('.drive optgroup',$dialog),nofiles=true;
    $s.empty();
    for (g in dsave) {
      if (dsave.hasOwnProperty(g)) {
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
