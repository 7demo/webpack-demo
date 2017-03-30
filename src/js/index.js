console.log('idnex')

    $('body').append('<h1>121212</h1>');
    // var require = require('request')
    // console.log(require)
    var request = require('../module/request.js');
    console.log(request)


    require.ensure([],function(){
        var knob = require('../plugins/jqueryknob/jquery.knob.min.js');
        console.log(knob)
    }, 'knob');
