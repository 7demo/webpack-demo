require('../css/index.css');

$('body').append('<h1>主要jsceshine</h1>');
var request = require('../module/request.js');
console.log(request, request(), 2);


require.ensure([],function(){
    var knob = require('../plugins/jqueryknob/jquery.knob.min.js');
    console.log(knob);
}, 'knob');
