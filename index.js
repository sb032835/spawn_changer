const places = require('./data.json'),
      Command = require('command');

module.exports = function SpawnChange(dispatch) {
	const teleport_enabled = true, 			// Change this to false if you do not want this module on. (Might as well remove it at that point)
		  auto_turnoff_time = 5;         // Time to Auto-Turn off in minutes.

	//<-----DON'T-----CHANGE-----ANYTHING-----UNDER-----THIS-----IF-----YOU-----DON'T-----KNOW-----WHAT-----YOU'RE------DOING----->

	let isHealer,
		portTo,
		teleport,
		timer;

	const command = Command(dispatch);
	const turnoff = () => {
		command.message('[Spawn Change] Turning off following dungeon bosses for safety reasons:');
		for(const place of places){
			for(const boss of Object.values(place.portTo)){
				if(place.name != 'Ghiliglade' && boss.active){
					boss.active = false;
					command.message(' ' + boss.comment + ' of ' + place.name);
				}
			}
		}
		command.message('[Spawn Change] Auto-turn off complete.');
	};
	const processCommand = (dungeon, whichBoss) => {
		dungeon = dungeon.toUpperCase();
    	if(dungeon === 'HELP'){
    		let str = '[Spawn Change] Possible dungeons are:';
    		for(place of places) str = str + ' ' + place.short_name;
			command.message(str);
			return;
    	}
    	if(whichBoss) whichBoss = whichBoss.toLowerCase();
    	else whichBoss = 'first';
    	for(const place of places){
			if(place.short_name === dungeon){
				if(place.portTo.hasOwnProperty(whichBoss)){
					for(const [num, boss] of Object.entries(place.portTo)){
						if(num === whichBoss){
							boss.active = !boss.active;
							if(boss.active) {
								command.message('[Spawn Change] ' + place.name + ' ' + boss.comment + ' Spawn has been turned ON! It will be turned off in ' + auto_turnoff_time + ' minutes for safety reasons!');
								clearTimeout(timer);
								timer = setTimeout(turnoff, auto_turnoff_time*60000);
							}
							else command.message('[Spawn Change] ' + place.name + ' ' + boss.comment + ' Spawn has been turned OFF!');
						}
						else if (num !== whichBoss && boss.active){
							boss.active = false;
							command.message('[Spawn Change] Turned off ' + boss.comment + ' of ' + dungeon + ' to avoid multiple spawn location.')
						}	
					}
					return;
				}
				else {
					command.message('[Spawn Change] ERROR: Unable to find ' + whichBoss + ' in ' + dungeon + '.');
					return;
				}
			}
		}
		command.message('[Spawn Change] ERROR: Unable to find ' + dungeon + '. Please type help for list of possible dungeons.');
	}

	command.add('SC', (dungeon, whichBoss) => {
    	processCommand(dungeon, whichBoss);
	});

	const distance = (A, B) => Math.sqrt(Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2) + Math.pow(B.z - A.z, 2));
	const locCheck = (A, B) => A.zone === B.zone && distance(A.loc, B.loc) < 5;
	const placeCheck = (A) => {
		for(const place of places){
			for(const boss of Object.values(place.portTo)){
				if(boss.active && locCheck(A, place.entrance)){	
					if(!place.allowHealer && isHealer) return;
					portTo = Object.assign({}, boss);
					teleport = true;
					break;
				}
			}
		}
	};

	dispatch.game.on('enter_game', () => {
	 	isHealer = (dispatch.game.me.class === 'priest' || dispatch.game.me.class === 'elementalist') ? true : false;

    });

    dispatch.hook('S_LOAD_TOPO', 3, event => {
    	//console.log(event)
		if(teleport_enabled) placeCheck(event);
		if(teleport){
			event.loc = portTo.loc;
			return true;
		}
    });

    dispatch.hook('S_SPAWN_ME', 2, event => {
    	//console.log(event)
        if(teleport){
	    	event.loc = portTo.loc;
	    	event.w = portTo.w;
	        teleport = false;
	        return true;
        };
    });
}
