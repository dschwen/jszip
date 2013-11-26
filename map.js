function Map($container) {

  var map = {}, id, x=500, y=100, $view=$('.view',$container)
    , boxw=102, boxh=52 // including border
    , dirs = {
      'n':[0,-1], 's':[0,1], 'w':[-1,0], 'e':[1,0],
      'ne':[1,-1], 'se':[1,1], 'nw':[-1,-1], 'sw':[-1,1], 
      'u':[0,-4], 'd':[0,4], '0':[0,0]
    }
    , nodes = {
      'n':[0.5,0], 's':[0.5,1], 'w':[0,0.5], 'e':[1,0.5],
      'ne':[1,0], 'se':[1,1], 'nw':[0,0], 'sw':[0,1], 
      'u':[0.2,0], 'd':[0.2,1], '0':[0.5,0.5]
    };

  // Connection class
  function Connection(r1,d1,r2,d2) {
    // build canvas get context
    this.canvas = $('<canvas></canvas>').appendTo($view);
    this.ctx = this.canvas[0].getContext("2d");
    this.room  = [r1, r2];
    this.dir   = [d1, d2];

    // add node dots
    this.node = [];
    if (d1!='0') {
      this.node.push( $('<div class="node"><div>').css({ left: boxw*nodes[d1][0]+'px', top: boxh*nodes[d1][1]+'px' }).appendTo(r1.div) );
    }
    if (d2!='0') {
      this.node.push( $('<div class="node"><div>').css({ left: boxw*nodes[d2][0]+'px', top: boxh*nodes[d2][1]+'px' }).appendTo(r2.div) );
    }

    // draw the connection
    this.update();

    // set references to this connection in room
    r1.addConnection(this);
    r2.addConnection(this);
  }
  Connection.prototype.update = function() {
    // connection points (2 for straight line, 4 for bezier)
    var p=[ [ this.room[0].x+boxw*nodes[this.dir[0]][0], this.room[0].y+boxh*nodes[this.dir[0]][1] ], 
            [],[],
            [ this.room[1].x+boxw*nodes[this.dir[1]][0] ,this.room[1].y+boxh*nodes[this.dir[1]][1] ] ];
    var dx = p[0][0]-p[3][0]
      , dy = p[0][1]-p[3][1]
      , r; 

    r = 0.5*Math.abs( dx*this._dirs[this.dir[0]][0] + dy*this._dirs[this.dir[0]][1] );
    p[1] = [ p[0][0]+r*this._dirs[this.dir[0]][0], 
             p[0][1]+r*this._dirs[this.dir[0]][1] ];
    r = 0.5*Math.abs( dx*this._dirs[this.dir[1]][0] + dy*this._dirs[this.dir[1]][1] );
    p[2] = [ p[3][0]+r*this._dirs[this.dir[1]][0], 
             p[3][1]+r*this._dirs[this.dir[1]][1] ];

    // find min/max coordinates for canvas size/position
    var min=[p[0][0],p[0][1]]
      , max=[p[0][0],p[0][1]]
      , i;
    for(i=1; i<p.length; ++i) {
      if( p[i][0]<min[0] ) min[0]=p[i][0];
      if( p[i][1]<min[1] ) min[1]=p[i][1];
      if( p[i][0]>max[0] ) max[0]=p[i][0];
      if( p[i][1]>max[1] ) max[1]=p[i][1];
    }
    // add gutter
    min[0]-=5; min[1]-=5; 
    max[0]+=5; max[1]+=5;
    // scale and position canvas
    this.canvas
      .attr({ width: (max[0]-min[0]), height: (max[1]-min[1]) })
      .css({ left: min[0]+'px', top: min[1]+'px' });

    // draw connector
    this.ctx.strokeStyle = (this.dir[1]==='0')?"#f00":"#000";
    this.ctx.beginPath()
    this.ctx.moveTo(p[0][0]-min[0],p[0][1]-min[1])
    this.ctx.bezierCurveTo( p[1][0]-min[0],p[1][1]-min[1], p[2][0]-min[0],p[2][1]-min[1], p[3][0]-min[0],p[3][1]-min[1] )
    this.ctx.stroke();
  }
  Connection.prototype.remove = function() {
    var i;
    this.canvas.remove();
    for (i=0; i<this.node.length; ++i) {
      this.node[i].remove();
    }
    // remove reference form rooms
    for (i=0; i<2; ++i) {
      room[i].removeConnection(this);
    }
  }
  Connection.prototype._nodes = {
    'n':[0.5,0], 's':[0.5,1], 'w':[0,0.5], 'e':[1,0.5],
    'ne':[1,0], 'se':[1,1], 'nw':[0,0], 'sw':[0,1], 
    'u':[0.2,0], 'd':[0.2,1], '0':[0.5,0.5]
  };
  Connection.prototype._dirs = {
    'n':[0,-1], 's':[0,1], 'w':[-1,0], 'e':[1,0],
    'ne':[0.5,-0.5], 'se':[0.5,0.5], 'nw':[-0.5,-0.5], 'sw':[-0.5,0.5], 
    'u':[0,-1], 'd':[0,1], '0':[0,0]
  }

  // Room class
  function Room(id,x,y) {
    var room = automap[id];

    // room has manually selected coordinates
    if ('xy' in room) {
      x=room.xy[0];
      y=room.xy[1];
    }

    // place room on map
    this.div = $('<div class="room"></div>').text(automap[id].name).attr('id','room'+id).css({left:x+'px', top:y+'px'}).appendTo($view);
    this.x=x;
    this.y=y;
    this.connections=[];

    // hook up events
    var dragged=false, that=this;
    this.div
      .on("mouseenter", function() {
        $(this).css('background-color','#ddd');
        for (e in dirs) {
          if (dirs.hasOwnProperty(e) && (e in automap[id])) {
            map[automap[id][e]].div.css('background-color','#eee');
          }
        }
      })
      .on("mouseleave", function() {
        $(this).css('background-color','');
        for (e in dirs) {
          if (dirs.hasOwnProperty(e) && (e in automap[id])) {
            map[automap[id][e]].div.css('background-color','');
          }
        }
      })
      .on("mousedown", function(e){
        var ox = e.pageX, oy = e.pageY      // TODO: relative to $view !
          , mx = map[id].x, my = map[id].y;
        $(this).addClass("isdragged");
        $('body').on("mousemove", function(e) {
          var i, dx = e.pageX-ox, dy = e.pageY-oy;

          // steps of 10
          dx -= dx%10;
          dy -= dy%10;

          // dit it move enough?
          if (dx!=0 || dy !=0 || dragged) {
            dragged=true;
            // update position
            map[id].x = mx+dx;
            map[id].y = my+dy;
            map[id].div.css({left:map[id].x+'px', top:map[id].y+'px'})
            // update connections
            for (i=0; i<map[id].connections.length; ++i) {
              map[id].connections[i].update();
            }
          }
        })
        e.stopPropagation();
      })
      .on("mouseup", function(e){
        $(this).removeClass("isdragged")
        $('body').off("mousemove");
        if (dragged) {
          automap[id].xy = [map[id].x,map[id].y];
        }
      });
  }
  Room.prototype.addConnection = function(c) {
    this.connections.push(c);
  }
  Room.prototype.removeConnection = function(c) {
    var i, l=this.connections;
    while ((i=l.indexOf(c)) !== -1) { l.splice(i, 1); }
  }

  // static member function
  Room.put = function(id,x,y) {
    // is this roomalready placed on the map?
    if (id in map) { return; }
    var auto = automap[id], e, exit, entrance, dx, dy;

    // create room
    var room = new Room(id,x,y);
    map[id] = room;

    // follow exits
    for (exit in dirs) {
      if (dirs.hasOwnProperty(exit) && (exit in auto)) {
        nextRoom = automap[auto[exit]];
        // determine displacement from exit location i
        dx = dirs[exit][0];
        dy = dirs[exit][1];
        // take entrance location into account, too
        entrance = '0';
        for (e in dirs) {
          if (dirs.hasOwnProperty(e) && (e in nextRoom) && nextRoom[e]==id) {
            if (dx==0) { dx = -dirs[e][0]; }
            if (dy==0) { dy = -dirs[e][1]; }
            entrance = e;
            break;
          }
        }
        Room.put(auto[exit],x+dx*110,y+dy*60);
        var conn = new Connection( room, exit, map[auto[exit]], entrance );
      }
    }
  }

  // viewport shift (TODO: put into closure)
  var viewx=0, viewy=0;

  $container
    .on("mousedown", function(e) {
      var ox = e.pageX, oy = e.pageY
        , vx = viewx, vy = viewy;
      $(this)
        .css('cursor','move')
        .on("mousemove", function(e) {
          var dx = e.pageX-ox, dy = e.pageY-oy;
          viewx = vx+dx;
          viewy = vy+dy;
          $view.css({ left:viewx+'px', top:viewy+'px' });  
        });
      })
    .on("mouseup", function(e) {
        $(this).css('cursor','').off("mousemove");
      })

  function update(a) {
    automap = a;
    for (id in automap) {
      if (automap.hasOwnProperty(id)) {
        // start a new cluster
        Room.put(id,x,y);
        y=y+500;
      }
    }
  }

  function clear() {
    $view.empty();
    map = {};
  }

  function highlight(id) {
    $('.current',$view).removeClass('current');
    $('#room'+id,$view).addClass('current');
  }

  return {
    update: update,
    clear: clear,
    highlight: highlight
  }
}
