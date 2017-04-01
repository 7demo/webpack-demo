
console.log('idnex')

    $('body').append('<h1>121212</h1>');
    var request = require('../module/request.js');
    console.log(request, request())


    require.ensure([],function(){
        var knob = require('../plugins/jqueryknob/jquery.knob.min.js');
        console.log(knob)
    }, 'knob');
