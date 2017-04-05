
console.log('idnex')
require('../scss/index.scss');
    var list = require('../component/show/list.js');

    $('body').append('<h1>121212</h1>');
    console.log(list)
    $('body').append(list)
    var request = require('../module/request.js');
    console.log(request, request())


    require.ensure([],function(){
        var knob = require('../plugins/jqueryknob/jquery.knob.min.js');
        console.log(knob)
    }, 'knob');
