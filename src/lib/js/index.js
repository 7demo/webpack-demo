
console.log('idnex')
require('../css/index.css')
    var list = require('../template/component/show/list.js');

    $('body').append('<h1>121212</h1>');
    console.log(list);
    $('body').append(list)
    var request = require('../module/request.js');
    console.log(request, request())


    require.ensure([],function(){
        var knob = require('../plugins/jqueryknob/jquery.knob.min.js');
        console.log(knob)
    }, 'knob');
