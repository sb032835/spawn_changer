const places = require('./data.json'),
      Command = require('command');

module.exports = function JujuSpawn(dispatch) {
	const teleport_enabled = true, 			// Change this to false if you do not want this module on. (Might as well remove it at that point)
		  auto_turnoff_time = 5;         // Time to Auto-Turn off in minutes.

	//<-----DON'T-----CHANGE-----ANYTHING-----UNDER-----THIS-----IF-----YOU-----DON'T-----KNOW-----WHAT-----YOU'RE------DOING----->

	let isHealer,
		portTo,
		teleport,
		timer;

	const command = Command(dispatch);
	const turnoff = () => {
		command.message('[JujuSpawn] Turning off following dungeon for safety reasons:');
		for(place of places){
			if(place.name != 'Ghiliglade' && place.active){
				place.active = false;
				command.message(' ' + place.name);
			}
		}
		command.message('[JujuSpawn] Auto-turn off complete.');
	};

	command.add('SC', arg => {
    	arg = arg.toUpperCase();
    	if(arg === 'HELP'){
    		let str = '[JujuSpawn] Possible dungeons are:';
    		for(place of places) str = str + ' ' + place.short_name;
			command.message(str);
			return;
    	}
    	for(place of places){
			if(place.short_name === arg){
				place.active = !place.active;
				const status = place.active ? 'ON!' : 'OFF!'
				command.message('[JujuSpawn] ' + place.name + ' Spawn has been turned ' + status + ' It will be turned off in ' + auto_turnoff_time + ' minutes for safety reasons!');
				clearTimeout(timer);
				timer = setTimeout(turnoff, auto_turnoff_time*60000);
				return;
			}
		}
		command.message('[JujuSpawn] ERROR: Unable to find ' + arg + '. Please type help for list of possible dungeons.');
	});

	const distance = (A, B) => Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2) + Math.pow(B.z - A.z, 2));
	const locCheck = (A, B) => A.zone === B.zone && distance(A.loc, B.loc) < 5;
	const placeCheck = (A) => {
		for(place of places){
				if(place.active && locCheck(A,place.entrance)){
					if(!place.allowHealer && isHealer) return;
					portTo = Object.assign({}, place.portTo);
					teleport = true;
					break;
				}
		}
	};

    dispatch.hook('S_LOGIN', 10, event => {
        isHealer = (event.templateId % 100 === 7 || event.templateId % 100 === 8) ? true : false;
    }); 

    dispatch.hook('S_LOAD_TOPO', 3, event => {
		if(teleport_enabled) placeCheck(event);
		if(teleport){
			event.loc = portTo.loc;
			return true;
		}
    });

    dispatch.hook('S_SPAWN_ME', 2, event => {
    	console.log(event)
        if(teleport){
	    	event.loc = portTo.loc;
	    	event.w = portTo.w;
	        teleport = false;
	        return true;
        };
    });
}
