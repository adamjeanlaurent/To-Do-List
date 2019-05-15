exports.getDay = function(){
  let today = new Date(); // creates a date object

    let options = { // options for .toLocaleDateString
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    };

    return today.toLocaleDateString('en-us',options); // based on the options, returns Sunday, May 5
}

