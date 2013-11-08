var i,j,
    startDir = 'left',
    icon_list = {
  bike: {file: 'icons/road_bike.svg', x: 575, y: 312, name: 'Road Bike'},
  car: {file: 'icons/race_car.svg', x: 503, y: 182, name: 'Race Car'},
  pony: {file: 'icons/rocking_horse.svg', x: 570, y: 500, name: 'Pony'},
  snail: {file: 'icons/snail.svg', x: 332, y: 142, name: 'Snail'},
  snail2: {file: 'icons/snail2.svg', x: 192, y: 122, name: 'Snail2'}
  // seahorse
  // robot
  // zombie
},
  colorList = [
  {value: "#1F78B4", name: 'Blue', active: 1},
  {value: "#33A02C", name: 'Green', active: 1},
  {value: "#E31A1C", name: 'Red', active: 1},
  {value: "#FF7F00", name: 'Orange', active: 1},
  {value: "#6A3D9A", name: 'Purple', active: 1},
  {value: "#A6CEE3", name: 'Light Blue', active: 1},
  {value: "#B2DF8A", name: 'Light Green', active: 1},
  {value: "#FB9A99", name: 'Light Red', active: 1},
  {value: "#FDBF6F", name: 'Light Orange', active: 1},
  {value: "#CAB2D6", name: 'Light Purple', active: 1}
],
    ponies = [],
    jockeys = [],
    random = false,
    ponyOrder = 'sorted',
    nextPlace = 1,
    raceLength = 10, // Race length in seconds
    running = false,
    done = false,
    allowChanging = true,
    advOptionsHidden = true,
    width = $('#right-col').width(),
    height = $(window).height()-100,
    xmax = 110,
    margins = [50, 30, 50, 30],
    mb = margins[0],
    ml = margins[1],
    mt = margins[2],
    mr = margins[3],
    w = width - (ml + mr),
    h = height - (mb + mt),
    x = d3.scale.linear().range([0, w]).domain([0,xmax]),
    y = d3.scale.linear().range([0, h]).domain([0,1]);

// Setup initial SVG chart
var svg = d3.select('#chart')
  .append('svg:svg')
    .attr('class', 'chart')
    .attr("width", width)
    .attr("height", height);

var defs = svg.append('defs');
var plot = svg.append('g')
  .attr('id','plot')
  .attr('transform','translate('+ml+','+mt+')');
var dataRegion = plot.append('g')
  .attr('id','data-region');

// Add the start and finish lines
d3.select('#data-region').selectAll('.border-line')
    .data([10, 100],function(d) { return d; })
  .enter()
    .append('svg:line')
      .classed('border-line',true)
      .attr('x1',function(d) { return x(d); })
      .attr('x2',function(d) { return x(d); })
      .attr('y1',y(0))
      .attr('y2',y(1))
      .style('stroke','black')
      .style('stroke-dasharray','10,10');

// Generic helper functions

var getRandomInt = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Specific helper functions

var getStepSize = function() {
  return (90*ponies.length*50)/(raceLength*1000);
};

var updateSpeed = function() {
  raceLength = 21-$('#race-speed').val();
  console.log(raceLength);
};

var processEnter = function(e) {
  if (e.which == 13) {
    addEntrant();
    e.preventDefault();
  }
};

// Major task functions

var addEntrant = function() {
  if (allowChanging) {
    var name = $('#name').val(),
        num = $('#num').val(),
        icon = $('#icon-picker').val(),
        col = $('select[name="colorpicker"]').val();

    if (name.length > 0 && +num > 0) {
      // Check to see if a jockey name exists, if so, don't allow it
      // to be reused
      var previouslyUsed = false;
      for (var i=0; i < jockeys.length; i++) {
        previouslyUsed = name == jockeys[i].name ? true : false;
      }
      if (previouslyUsed) {
        window.alert('Sorry, you can not reuse a Jockey');
      } else {

        // Add the individual ponies and the jockey to the list
        for (i = 0; i < +num; i++) {
          ponies.push({
            progress: 0,
            jockey: name,
            num: i,
            col: col,
            icon: icon,
            finishPos: 0
          });
        }

        // Add the jockey to the jockies list
        jockeys.push({
          icon: icon,
          name: name,
          num: num,
          col: col
        });

        // Create colorized svg def
        var loadSvg = function(xml) {
          var importedNode = document.importNode(xml.documentElement, true);
          defs.append("g")
              .attr('id',icon + '-' +
                    col.split('').splice(1,6).join(''))
              .attr('transform','translate(-' + icon_list[icon].x + ',-' +
                    icon_list[icon].y + ')')
            .each(function(d, i) {
              var icon = this.appendChild(importedNode.cloneNode(true));
              d3.select(icon).selectAll('#color-me path')
                 .style('fill',col)
                 .style('stroke',col);
            });

            // Update pony line-up once defs have been updated with new
            // colored icon
            updatePonyLineup();
        };

        d3.xml(icon_list[icon].file, "image/svg+xml", loadSvg);

        updateJockeyLineup();

        // Remove the color from the color picker
        for (i = 0; i < colorList.length; i++) {
          if (col == colorList[i].value) {
            colorList[i].active = 0;
          }
        }
        updatePicker();

        // Clear input boxes and reset focus
        $('#name').val('');
        $('#num').val('');
        $('#name').focus();
      }
    } else {
      window.alert('Please enter a unique jockey name' +
                   ' and # of ponies for that jockey!');
    }
  }
};

var removeEntrant = function(i) {
  if (allowChanging) {
    // Figure out which indexes we need to remove
    var toRemove = [];
    for (j = 0; j < ponies.length; j++) {
      if (ponies[j].jockey == jockeys[i].name) {
        toRemove.push(j);
      }
    }

    // Remove them in reverse order so we don't have
    // to do anything fancy with indexes
    for (j = toRemove.length-1; j > -1; j--) {
      ponies.splice(toRemove[j],1);
    }

    // Remove jockey's rects and move remaining ponies/fix y-scale
    updatePonyLineup();

    // Add the jockeys color back to picker
    for (j = 0; j < colorList.length; j++) {
      if (jockeys[i].col == colorList[j].value) {
        colorList[j].active = 1;
      }
    }
    updatePicker();

    // Remove jockeys name from displayed list list
    jockeys.splice(i,1);
    updateJockeyLineup();
  }
};

var runPonies = function() {
  if (running) {
    // Figure out which (if any) ponies haven't finished
    var notFinished = [];
    for (var i = 0; i < ponies.length; i++) {
      if (ponies[i].progress < 90) {
        notFinished.push(i);
      }
    }

    // See if any of the ponies still need to finish
    if (notFinished.length > 0) {
      // Move a random (still running) pony forward and record if they
      // made it to the end
      var tmp = getRandomInt(0,notFinished.length-1);
      ponies[notFinished[tmp]].progress += getStepSize();
      if (ponies[notFinished[tmp]].progress >= 90)
      {
        ponies[notFinished[tmp]].finishPos = nextPlace++;
      }

      // Actually move the pony
      d3.selectAll('.pony')
          .data(ponies,function(d) { return d.jockey + d.num; })
        .transition().ease('linear').duration(50)
          .attr('transform',function(d,i) {
            return 'translate('+x(d.progress)+',0)';
          });
      setTimeout(runPonies,50);
    } else {
      d3.selectAll('.rank-entry').remove();
      d3.select('#winner-list').selectAll('.rank-entry')
          .data(ponies,function(d) { return d.finishPos; })
        .enter().append('p')
          .classed('rank-entry',true)
          .text(function(d,i) { return d.finishPos + ': ' + d.jockey;}) ;

      d3.selectAll('.rank-entry').sort(function(a,b) {
        return a.finishPos < b.finishPos ? -1 : 1;
      })
        .order();

      $('#winner-list-modal').modal('show');

      $("#go-button").text('Done');
      done = true;
      running = false;
    }
  }
};

var resetPonies = function() {
  // Send the ponies back to the beginning
  for (i = 0; i < ponies.length; i++) {
    ponies[i].progress = 0;
  }

  done = false;
  running = false;
  nextPlace = 1;

  d3.selectAll('.pony')
      .data(ponies,function(d) { return d.jockey + d.num; })
    .transition().ease('linear').duration(250)
      .attr('transform',function(d,i) {
        return 'translate('+x(d.progress)+',0)';
      });

  $("#go-button").text('Go!');

  d3.selectAll('.rank-entry').remove();
};


var updateJockeyLineup = function() {

  // Select current jockey list
  var jockeyList = d3.select('#jockey-list').selectAll('.jockey')
      .data(jockeys);

  // Remove old jockeys
  jockeyList.exit().remove();

  // Update entries for existing jockeys
  jockeyList.select('.jockey-name')
    .attr('value',function(d) { return d.name; });
  jockeyList.select('.jockey-num')
    .attr('value',function(d) { return d.num; });
  jockeyList.select('.jockey-col')
    .style('background-color',function(d) { return d.col; });

  // Add new jockey entries
  var newJockeyList = jockeyList.enter()
      .append('div')
      .classed('jockey',true)
      .append('form')
      .attr('class','form-inline')
      .attr('role','form');

  var nameEntry = newJockeyList.append('div')
    .attr('class','form-group');

  nameEntry.append('input')
    .attr('type','text')
    .attr('disabled',true)
    .attr('value',function(d) { return d.name; })
    .classed('form-control',true)
    .classed('jockey-name',true);

  nameEntry = newJockeyList.append('div')
    .attr('class','form-group');

  nameEntry.append('input')
    .attr('type','text')
    .attr('disabled',true)
    .attr('value',function(d) { return d.num; })
    .classed('form-control',true)
    .classed('jockey-num',true);

  newJockeyList.append('span')
    .text('\u00A0\u00A0\u00A0\u00A0')
    .style('background-color',function(d) { return d.col; })
    .classed('simplecolorpicker',true)
    .classed('icon',true)
    .classed('jockey-col',true);

  newJockeyList.append('button')
    .text('\u2012')
    .attr('type','button')
    .classed('btn',true)
    .classed('btn-default',true)
    .classed('jockey-add',true)
    .on('click',function(d,i) {removeEntrant(i); });

};

var updatePonyLineup = function() {
  // Make sure y domain is correct
  y.domain([0,ponies.length]);

  // Update position for old ponies
  var ponyGroup = d3.select('#data-region').selectAll('.pony-group')
      .data(ponies,function(d) {return d.jockey + d.num; });
  ponyGroup.transition().duration(100)
      .attr('transform',function(d,i) { return 'translate(0,'+y(i)+')';});

  // Add new group for new ponies
  var newPonyGroup = ponyGroup
    .enter().append('svg:g')
      .attr('transform',function(d,i) { return 'translate(0,'+y(i)+')';})
      .classed('pony-group',true);

  // Update positions for existing lanes
  ponyGroup.select('.pony-lane')
    .transition().duration(100)
      .attr('y',y(1)-Math.min(y(0.05)-y(0),height/100)/2)
      .attr('height',Math.min(y(0.05)-y(0),height/100))
      .attr('x',x(10))
      .attr('width',x(90)-x(0))
      .style('fill',function(d) { return d.col;});

  // Add new lanes
  newPonyGroup
    .append('svg:rect')
      .attr('y',y(1)-Math.min(y(0.05)-y(0),height/100)/2)
      .attr('height',Math.min(y(0.05)-y(0),height/100))
      .attr('x',x(10))
      .attr('width',x(90)-x(0))
      .style('stroke','none')
      .classed('pony-lane',true)
      .style('fill',function(d) { return d.col;});

  // Add new pony shapes
  var racePonies = newPonyGroup.append('svg:g')
    .classed('pony',true);

  // Update positions for existing icons
  ponyGroup.select('.pony').select('.race-pony')
    .transition().duration(100)
      .attr('transform',function(d,i) {
        var maxH = y(0.9)-y(0);
        var maxW = x(10)-x(0);
        var widthScale = maxW/icon_list[d.icon].x;
        var heightScale = maxH/icon_list[d.icon].y;
        var scale = d3.min([widthScale,heightScale]);
        return 'translate('+x(10)+','+y(1)+') scale('+scale+','+scale+')';
      });

  // Add new icons
  var newBikes = racePonies.append('svg:g')
      .classed('race-pony',true)
      .attr('transform',function(d,i) {
        var maxH = y(0.9)-y(0);
        var maxW = x(10)-x(0);
        var widthScale = maxW/icon_list[d.icon].x;
        var heightScale = maxH/icon_list[d.icon].y;
        var scale = d3.min([widthScale,heightScale]);
        return 'translate('+x(10)+','+y(1)+') scale('+scale+','+scale+')';
      });

  newBikes.append('use')
    .attr('xlink:href',function(d) {
      return '#'+d.icon+'-'+d.col.split('').splice(1,6).join('');
    });

  ponyGroup.exit().remove();
};

var toggleRandomOrder = function() {
  // TODO Change button style/activate
  ponyOrder = ponyOrder == 'sorted' ? 'random' : 'sorted';

  if (ponyOrder === "sorted") {
    // Sort ponies back to jockey order
    neworder = [];
    for (i=0; i < jockeys.length; i++) {
      for (j=0; j < ponies.length; j++) {
        if (jockeys[i].name == ponies[j].jockey) {
          neworder.push(j);
        }
      }
    }
    newponies = [];
    for (j=0; j < ponies.length; j++) {
      newponies.push(ponies[neworder[j]]);
    }
    ponies = newponies;
  } else {
    // Shuffle the ponies, using code from here:
    // http://stackoverflow.com/a/2450976
    var currentIndex = ponies.length, temporaryValue, randomIndex;

     // While there remain elements to shuffle...
     while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = ponies[currentIndex];
      ponies[currentIndex] = ponies[randomIndex];
      ponies[randomIndex] = temporaryValue;
    }
  }
  updatePonyLineup();
};

var toggleStartDir = function() {
  startDir = startDir == 'left' ? 'right' : 'left';

  if (startDir === "left") {
    d3.select('#plot')
      .transition().duration(1000)
        .attr('transform','translate('+ml+','+mt+') scale(1,1)');
  } else {
    d3.select('#plot')
      .transition().duration(1000)
        .attr('transform','translate('+(w+ml)+','+mt+') scale(-1,1)');
  }
};

// UI specific functions

var expandAdvOptions = function() {
  if (advOptionsHidden) {
    $('#adv-options-expand').css({'display':'block'});
    $('#adv-options-title').text('- Hide Advanced Options');
    advOptionsHidden = false;
  } else {
    $('#adv-options-expand').css({'display':'none'});
    $('#adv-options-title').text('+ Show Advanced Options');
    advOptionsHidden = true;
  }
};


var updatePicker = function() {
  // Add the color picker
  $('select[name="colorpicker"]').empty();
  var firstCol = '';
  for (var i = 0; i < colorList.length; i++) {
    if (colorList[i].active) {
      if (firstCol === '') {
        firstCol = colorList[i].value;
      }
      var option = $('<option></option')
          .attr("value",colorList[i].value)
          .text(colorList[i].name);
      $('select[name="colorpicker"]').append(option);
    }
  }

  $('select[name="colorpicker"]').simplecolorpicker();
  $('select[name="colorpicker"]').simplecolorpicker('selectColor',firstCol);
  $('select[name="colorpicker"]').simplecolorpicker('destroy');
  $('select[name="colorpicker"]').simplecolorpicker({picker: true});
};


var runButtonClick = function() {
  // Only run ponies if there is at least one to run!
  if (ponies.length > 0) {
    if (!running && !done) {
      running = true;
      $("#go-button").text('Pause');
      $("#name").prop('disabled', true);
      $("#num").prop('disabled', true);
      allowChanging = false;
      runPonies();
    } else if (!done) {
      running = false;
      $("#go-button").text('Go!');
    }
  } else {
    window.alert('You have to have at least one jockey racing!');
  }
};

// Deal with 'Reset' button clicks
var resetButtonClick = function() {
  $("#name").prop('disabled', false);
  $("#num").prop('disabled', false);
  allowChanging = true;
  resetPonies();
};

$(window).resize(function() {
  // TODO Add in limits at which points we don't get smaller than
  width = $('#right-col').width();
  height = $(window).height()-100;

  w = width - (ml + mr);
  h = height - (mb + mt);
  x = d3.scale.linear().range([0, w]).domain([0,xmax]);
  y = d3.scale.linear().range([0, h])
    .domain([0,ponies.length > 0 ? ponies.length : 1]);

  d3.select('#chart').select('svg.chart')
    .attr("width", width)
    .attr("height", height);

  d3.select('#data-region').selectAll('.border-line')
    .attr('x1',function(d) { return x(d); })
    .attr('x2',function(d) { return x(d); })
    .attr('y1',y(0))
    .attr('y2',y(ponies.length > 0 ? ponies.length : 1));

  updatePonyLineup();
});

// Add pop-up winner dialog
var addWinnerDialog = function() {
  var dialog = d3.select('body')
    .append('div')
      .attr('class','modal fade')
      .attr('id','winner-list-modal')
      .attr('tabindex','-1')
      .append('div')
        .attr('class','modal-dialog')
        .append('div')
          .attr('class','modal-content');

  var dialog_header = dialog.append('div')
    .attr('class','modal-header');

  dialog_header.append('button')
      .attr('type','button')
      .attr('class','close')
      .attr('data-dismiss','modal')
      .text('X');

  dialog_header.append('h4')
    .attr('class','modal-title')
    .text('Race Results');

  dialog.append('div')
    .attr('class','modal-body')
    .attr('id','winner-list');

  dialog.append('div')
    .attr('class','modal-footer')
    .append('button')
      .attr('type','button')
      .attr('class','btn btn-default')
      .attr('data-dismiss','modal')
      .text('Close');
};

////// Things to run on page load

$('input[id=num]').on('keypress',function(e) { return processEnter(e); });
$('input[id=name]').on('keypress',function(e) { return processEnter(e); });

// Advance option toggle buttons
$("#race-dir-toggle").on( "click", function() {
  toggleStartDir();
});

$("#randomize-toggle").on("click", function() {
  toggleRandomOrder();
});

updatePicker();
addWinnerDialog();
