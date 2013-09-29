var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

var getStepSize = function() {
    return (90*ponies.length*50)/(raceLength*1000);
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
            d3.selectAll('.pony').data(ponies)
                .transition().ease('linear').duration(50)
                .attr('transform',function(d,i) { return 'translate('+x(d.progress)+',0)';})
            setTimeout(runPonies,50);
        } else {
            d3.selectAll('.rank-entry').remove();
            d3.select('#winner-list').selectAll('.rank-entry')
               .data(ponies,function(d) { return d.finishPos; })
              .enter()
                .append('p')
                .classed('rank-entry',true)
                .text(function(d,i) { return d.finishPos + ': ' + d.jockey;}) ;

           d3.selectAll('.rank-entry').sort(function(a,b) { return a.finishPos < b.finishPos ? -1 : 1; }).order(); 
               
           // setTimeout(function() { d3.select('#winner-list').style('display','block'); }, 350);
            $(function() {
                $( "#winner-list" ).dialog({
                  height: 200,
                  modal: true
                });
              });
           
            d3.selectAll('#controls button').filter(function(d,i) { return i == 0;}).text('Done');
            done = true;
            running = false;
        }
    }
};

var addEntrant = function() {
    if (allowChanging) {
        var name = $('#name').val(),
            num = $('#num').val(),
            col = $('select[name="colorpicker"]').val();

        if (name.length > 0 && !isNaN(+num)) {
            // Check to see if a jockey name exists, if so, don't allow it
            // to be reused
            var previouslyUsed = false;
            for (var i=0; i < jockeys.length; i++) {
                previouslyUsed = name == jockeys[i].name ? true : false;
            }
            if (previouslyUsed) {
                window.alert('Sorry, you can not reuse a Jockey')
            } else {

                // Add the individual ponies and the jockey to the list
                for (var i = 0; i < +num; i++) {
                    ponies.push({progress:0,
                            jockey:name,
                            col:col,
                            finishPos:0});
                }

                // Add the jockey to the jockies list
                jockeys.push({name:name,num:num,col:col});

                updateJockeyLineup();
                updatePonyLineup();
            }

            $('#name').val('Jockey');
            $('#num').val('#');
            formDefaulter.add('name');
            formDefaulter.add('num');
            $('#name').removeClass("edited-input");
            $('#num').removeClass("edited-input");
            $('#name').addClass("default-input");
            $('#num').addClass("default-input");
        } else {
            window.alert('Please enter a unique jockey name and # of ponies for that jockey!')
        }
    }
};

var removeEntrant = function(i) {
    if (allowChanging) {
        // Figure out which indexes we need to remove
        var toRemove = [];
        for (var j = 0; j < ponies.length; j++) {
            if (ponies[j].jockey == jockeys[i].name) {
                toRemove.push(j);
            }
        }

        // Remove them in reverse order so we don't have 
        // to do anything fancy with indexes
        for (var j = toRemove.length-1; j > -1; j--) {
            ponies.splice(toRemove[j],1);
        }

        // Remove jockey's rects and move remaining ponies/fix y-scale 
        updatePonyLineup();

        // Remove jockeys name from displayed list list
        jockeys.splice(i,1);
        updateJockeyLineup();
    }
};

var resetPonies = function() {
    // Send the ponies back to the beginning
    for (var i = 0; i < ponies.length; i++) {
        ponies[i].progress = 0;
    }

    done = false;
    running = false;
    nextPlace = 1;

    d3.selectAll('.pony').data(ponies)
        .transition().ease('linear').duration(250)
        .attr('transform',function(d,i) { return 'translate('+x(d.progress)+',0)';})

    d3.selectAll('#controls button').filter(function(d,i) { return i ==
            0;}).text('Go!');

    d3.selectAll('.rank-entry').remove();
};

var updateJockeyLineup = function() {

    // Select current jockey list
    var jockeyList = d3.select('#jockey-list').selectAll('.jockey')
            .data(jockeys);

    // Remove old jockeys
    jockeyList.exit().remove();
    
    // Update entries for existing jockeys
    jockeyList.select('.jockey-name').attr('value',function(d) { return d.name; })
    jockeyList.select('.jockey-num').attr('value',function(d) { return d.num; })
    jockeyList.select('.jockey-col').style('background-color',function(d) { return d.col; })

    // Add new jockey entries
    var newJockeyList = jockeyList.enter()
            .append('div')
            .classed('jockey',true);

    newJockeyList.append('input')
        .attr('type','text')
        .attr('disabled','disabled')
        .attr('value',function(d) { return d.name; })
        .classed('jockey-name',true);

    newJockeyList.append('input')
        .attr('type','text')
        .attr('disabled','disabled')
        .attr('value',function(d) { return d.num; })
        .classed('jockey-num',true);

    newJockeyList.append('input')
        .attr('type','text')
        .attr('disabled','disabled')
        .style('background-color',function(d) { return d.col; })
        .classed('jockey-col',true);

    newJockeyList.append('span')
        .text('-')
        .classed('jockey-remove',true)
        .on('click',function(d,i) {removeEntrant(i); });

};


var updatePonyLineup = function() {
    // Make sure y domain is correct
    y.domain([0,ponies.length]);
    
    var ponyGroup = d3.select('#data-region').selectAll('.pony-group')
            .data(ponies);

    // Update position for old ponies
    ponyGroup.transition().duration(100)
            .attr('transform',function(d,i) { return 'translate(0,'+y(i)+')';});

    // Add new group for new ponies
    var newPonyGroup = ponyGroup.enter()
        .append('svg:g')
        .attr('transform',function(d,i) { return 'translate(0,'+y(i)+')';})
        .classed('pony-group',true);
    
    // Update positions for existing lanes
    ponyGroup.select('.pony-lane') 
        .transition().duration(100)
            .attr('y',y(.5)-Math.min(y(.05)-y(0),height/100)/2)
            .attr('height',Math.min(y(.05)-y(0),height/100))
            .attr('x',x(10))
            .attr('width',x(90)-x(0))
            .style('fill',function(d) { return d.col;});

    // Add new lanes
    newPonyGroup.append('svg:rect')
            .attr('y',y(.5)-Math.min(y(.05)-y(0),height/100)/2)
            .attr('height',Math.min(y(.05)-y(0),height/100))
            .attr('x',x(10))
            .attr('width',x(90)-x(0))
            .style('stroke','none')
            .classed('pony-lane',true)
            .style('fill',function(d) { return d.col;});

    // Update positions for existing ponies
    ponyGroup.select('.pony').select('.race-pony')
        .transition().duration(100)
            .style('fill',function(d) { return d.col;})
            .attr('y',y(.5)-Math.min(y(.5)-y(0),height/10)/2)
            .attr('height',Math.min(y(.5)-y(0),height/10))
            .attr('width',x(10)-x(0));

    // Add new pony groups
    var racePonies = newPonyGroup.append('svg:g')
            .classed('pony',true);

    racePonies.append('svg:rect')
            .style('stroke','none')
            .attr('y',y(.5)-Math.min(y(.5)-y(0),height/10)/2)
            .attr('height',Math.min(y(.5)-y(0),height/10))
            .attr('width',x(10)-x(0))
            .style('stroke','none')
            .classed('race-pony',true)
            .style('fill',function(d) { return d.col;});

    //racePonies.append('svg:text')
    //    .text(function(d) { console.log(d); return d.jockey[0]; })
    //    .attr('x',0)
    //    .attr('y',0);

    ponyGroup.exit().remove();
};

var expandAdvOptions = function() {
    if (advOptionsHidden) {
        d3.select('#adv-options-expand').style('display','block');
        d3.select('#adv-options-title').text('- Hide Advanced Options');
        advOptionsHidden = false;
    } else {
        d3.select('#adv-options-expand').style('display','none');
        d3.select('#adv-options-title').text('+ Show Advanced Options');
        advOptionsHidden = true;
    }
};
