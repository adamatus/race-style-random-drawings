// TODO Record 1st, 2nd, 3rd so multiple winners can be picked
    // Add option to run all the way to end, give full ranking list
// TODO What should we do about adding ponies in the middle of a race?
// TODO Completely refactor code so it looks like I planned out the
    // implementation rather than just hacking it together ;)
// TODO Fix other TODO items below
// TODO Remove a color from picker once it has been used?
// TODO Add this into an expanded options section which is hidden by default
    // TODO Add option to switch between rect/pony/bike
    // TODO Add speed control/logic
        // Faster/slower

var getRandomInt = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var getStepSize = function() {
    return (90*ponies.length*50)/(10*1000);
}

var runPonies = function()
{
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

            d3.selectAll('.pony').data(ponies)
                .transition().ease('linear').duration(50).attr('x',function(d) {
                        return x(d.progress); })
            setTimeout(runPonies,50);
        } else {
            // TODO Add nice winner pop-up
            d3.selectAll('#controls button').filter(function(d,i) { return i == 0;}).text('Done');
            done = true;
            running = false;
        }
    }
}

var addEntrant = function()
{
    var name = $('#name').val(),
        num = $('#num').val(),
        col = $('#color1').val();

    if (name.length > 0 && !isNaN(+num))
    {
        // TODO Check to see if a jockey name exists, if so, don't allow it
        // to be reused

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
    } else {
        // TODO Should popup a warning message
    }
}

var removeEntrant = function(i) {
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

var resetPonies = function() {
    // Send the ponies back to the beginning
    for (var i = 0; i < ponies.length; i++)
    {
        ponies[i].progress = 0;
    }
    done = false;
    running = false;
    d3.selectAll('.pony').data(ponies)
        .transition().ease('linear').duration(250).attr('x',function(d) {
                return x(d.progress); })
    d3.selectAll('#controls button').filter(function(d,i) { return i ==
            0;}).text('Go!');
    nextPlace = 1;
}

var updateJockeyLineup = function() {
    var jockeyList = d3.select('#jockey-list').selectAll('.jockey')
            .data(jockeys)
        .text(function(d) { return d.name + ' (' + d.num + ')'; }) 
        .style('color',function(d) { return d.col; })

    jockeyList.enter()
            .append('p')
            .text(function(d) { return d.name + ' (' + d.num + ')'; }) 
            .classed('jockey',true)
            .style('color',function(d) { return d.col; })
        .on('click',function(d,i) { removeEntrant(i); });

    jockeyList.exit().remove();
};


var updatePonyLineup = function() {
    // Make sure y domain is correct
    y.domain([0,ponies.length]);
    
    // Add new lanes for ponies
    var ponyLanes = d3.select('#data-region').selectAll('.pony-lane')
        .data(ponies);
    
    // Update positions for existing lanes
    ponyLanes.transition().duration(100)
            .attr('y',function(d,i) { return y(i+.5-.025); })
            .style('fill',function(d) { return d.col;})
            .attr('height',y(.050)-y(0));

    ponyLanes.enter()
            .append('svg:rect')
            .attr('height',y(.05)-y(0))
            .attr('x',x(10))
            .attr('width',x(90)-x(0))
            .attr('y',function(d,i) { return y(i+.5-.025); })
            .style('stroke','none')
            .classed('pony-lane',true)
            .style('fill',function(d) { return d.col;});

    ponyLanes.exit().remove();

    // Add new ponies
    var ponyList = d3.select('#data-region').selectAll('.pony')
            .data(ponies);
    
    // Update positions for existing ponies
    ponyList.transition().duration(100)
            .attr('y',function(d,i) { return y(i+.25); })
            .style('fill',function(d) { return d.col;})
            .attr('height',y(.50)-y(0));

    ponyList.enter()
            .append('svg:rect')
            .attr('height',y(.5)-y(0))
            .attr('x',function(d) { return x(d.progress); })
            .attr('width',x(10)-x(0))
            .attr('y',function(d,i) { return y(i+.25); })
            .style('stroke','none')
            .classed('pony',true)
            .style('fill',function(d) { return d.col;});

    ponyList.exit().remove();
};

