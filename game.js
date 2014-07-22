var game;
var elements = new Array, soundElements = new Array, sounds = new Array, totalAssets = 0, loadedAssets = 0, assets = new Array, urlsPaysage;
jQuery(function($){
	/*init();
	createLandScape();
	createRabbit();
	animate();*/

	//Gestion du chargement des éléments

	elements['lapin'] = 'models/animated/lapin.js';
	elements['sucette'] = 'models/animated/sucette.js';
	elements['texturesol'] = 'textures/terrain/backgrounddetailed6.jpg';
	var urlBasePaysage = 'textures/cube/sky/';
	urlsPaysage =  [urlBasePaysage + "px.jpg", urlBasePaysage + "nx.jpg", urlBasePaysage + "py.jpg", urlBasePaysage + "ny.jpg", urlBasePaysage + "pz.jpg", urlBasePaysage + "nz.jpg"];
	soundElements['catch_sucette'] = 'sound/catch_sucette.wav'
	soundElements['bulle_destroyed'] = 'sound/bulle_destroyed.wav'
	soundElements['die'] = 'sound/die.wav'


	//On charge tout et quand c'est fait on lance le jeu (onAssetsLoaded)
	totalAssets = Object.size(elements) + urlsPaysage.length + Object.size(soundElements);
	loadAssets(elements);
	loadAssets(soundElements);
	loadAssets(urlsPaysage);
});


function loadAssets(tab){
	for(k in tab){
		console.log('Chargement de '+k+' -> '+tab[k]);
		var exp = tab[k].split('.');
		if(exp[exp.length-1] == 'js'){
			$.getJSON( tab[k], onAssetsLoaded);
		}else if(exp[exp.length-1] == 'wav'){
			sounds[k] = new buzz.sound(tab[k], {preload:true});
			onAssetsLoaded();
		}else{
			assets[k] = new Image();
			assets[k].src = tab[k];
			assets[k].onload=onAssetsLoaded;
		}
	}
}

function onAssetsLoaded(e){
	$('#loading span').text('('+parseInt((++loadedAssets)/totalAssets*100)+'%)');
	if(loadedAssets == totalAssets){
		console.log('Chargement fait : '+loadedAssets+'/'+totalAssets);
		game = new Game();
		game.init();
		animate();
	}
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

var Game = function(opts){
	this.canBeAnimated = false;
	this.camera, this.scene, this.renderer;
	this.container, this.loader;
	this.user, this.environment;
	var self = this;
	this.camLight;
	this.camDistance = 515;
	this.bullesManager, this.sucettesManager;
	this.lives = 3, this.alive = true;
	this.userAbleToHunt = false, this.timer, this.huntEnd, this.huntDuration = 30*1000;

	this.init = function(){
		this.container = $('#gamecanvas');

		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		stats.domElement.style.left = '30px';
		stats.domElement.style.zIndex = 100;

		setInterval( function () {
			stats.begin();

		    	stats.end();

		}, 1000 / 60 );

		this.container.append(stats.domElement);

		this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 100000 );
		this.scene = new THREE.Scene();
		this.renderer = new THREE.WebGLRenderer();

		this.camera.position.set(0, 150, 400);
		this.camera.lookAt(this.scene.position);

		this.camLight = new THREE.PointLight(0xffffff, 0.75);
		this.scene.add(this.camLight);

		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.container.append( this.renderer.domElement );

		this.environment = new Environment();
		this.environment.init(this.scene);

		this.user = new Lapin();
		this.user.init(this.scene, this.start);

		this.bullesManager = new BullesManager();
		this.sucettesManager = new SucettesManager();
		

		window.addEventListener('resize', this.onWindowResize, false);
		window.addEventListener('DOMMouseScroll', this.onDocumentMouseWheel, false);
  		window.addEventListener('mousewheel', this.onDocumentMouseWheel, false);
  		document.addEventListener( 'mousemove', this.onMouseMove, false );

	}

	this.MakeUserAbleToHunt = function(time){
		var duration = time != undefined ? time*1000 : this.huntDuration;
		this.userAbleToHunt = true;
		this.huntEnd = new Date().setTime(new Date().getTime() + duration);
		$('#hunt').parent().addClass('important');
		this.timer = setInterval(function(){
			var total = Math.round((self.huntEnd - new Date().getTime())/1000);
			
			if(total < 0){
				clearInterval(self.timer);
				self.userAbleToHunt = false;
				$('#hunt').parent().removeClass('important');
				if(Object.size(game.sucettesManager.sucettes) == 0 && Object.size(game.bullesManager.bulles) > 0){
					game.user.lost();
				}
			}else{
				$('#hunt').text(total);
			}
		}, 1000);
	}

	this.start = function(){
		self.setFocus(self.user.mesh);
		$('#loading').fadeOut(1000, function(){
			$(this).remove();
		});

		for(var i =0; i < 15; i++){
			self.bullesManager.create(Math.floor(Math.random() * 6000) - 3000, 100, Math.floor(Math.random() * 6000) - 3000, 50, self);
			
		}
		for(var i =0; i < 5; i++){
			self.sucettesManager.create(Math.floor(Math.random() * 6000) - 3000,100,Math.floor(Math.random() * 6000) - 3000,self);
		}

		self.canBeAnimated = true;

		controls = {
	                left: false,
	                up: false,
	                right: false,
	                down: false
	            };
		$(document).keydown(function (e) {
		            switch (e.keyCode) {
		                case 37:
		                    controls.left = true;
		                    break;
		                case 38:
		                    controls.up = true;
		                    break;
		                case 39:
		                    controls.right = true;
		                    break;
		                case 40:
		                    controls.down = true;
		                    break;
		                default:
		                    return;
		            }
		         
		            e.preventDefault();
		           self.user.setDirection(controls);
	        });

	        $(document).keyup(function (e) {
	            switch (e.keyCode) {
	                case 37:
	                    controls.left = false;
	                    break;
	                case 38:
	                    controls.up = false;
	                    break;
	                case 39:
	                    controls.right = false;
	                    break;
	                case 40:
	                    controls.down = false;
	                    break;
	                default:
	                    return;
	            }

	             e.preventDefault();

	           self.user.setDirection(controls);
	        });
	}

	

	this.animate = function(){
		if(this.canBeAnimated){
			//Gestion user
			if(this.user.mesh){
				this.setFocus(this.user.mesh);
				this.user.motion();
			}

			this.bullesManager.animate(this);
			this.sucettesManager.animate(this);
			this.renderer.render( this.scene, this.camera );
		}
		//Gestion Menu
		$('#bulles').text(Object.size(this.bullesManager.bulles));
		$('#sucettes').text(Object.size(this.sucettesManager.sucettes));
		$('#vies').text(this.lives);
	}

	this.onWindowResize = function(){
		self.camera.aspect = window.innerWidth / window.innerHeight;
		self.camera.updateProjectionMatrix();

		self.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	this.onMouseMove = function(e){
		self.mouseX = ( e.clientX - window.innerWidth/2 );
		self.mouseY = ( e.clientY - window.innerHeight/2 ) * 2;
	}

	this.onDocumentMouseWheel = function( e ) {
		var mW = ((typeof e.wheelDelta != "undefined")?(-e.wheelDelta):e.detail);
		self.camDistance += mW;
	}

	this.setFocus = function(object){
	        this.camera.position.set(object.position.x, object.position.y + 200, object.position.z - this.camDistance);
	        this.camLight.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
	        this.camera.lookAt(object.position);
	}
}

var SucettesManager = function(opts){
	this.sucettes = [];
	this.geometry = null;
	this.material = null;
	this.create = function(x,y,z,game){
		if(this.geometry == null){
			var me = this;
			var loader = new THREE.JSONLoader(true);
			loader.load(elements['sucette'], function (geometry, mat) {
				me.material = mat;
				me.geometry = geometry;
				me.createMesh(x,y,z,game);
			});
		}else{
			this.createMesh(x,y,z,game);
		}
	}
	this.createMesh = function(x,y,z,game){
		var mesh = new THREE.Mesh(this.geometry, new THREE.MeshFaceMaterial( this.material ));
		mesh.scale.set(14, 14, 14);
		mesh.position.set(x,y,z);
		mesh.rotation.x= 0.3;
		game.scene.add(mesh);
		this.sucettes.push({
			mesh: mesh
		});
	}

	this.animate = function(game){
		for (var i = 0; i < this.sucettes.length; i++) {
			var sucette = this.sucettes[i];
			sucette.mesh.rotation.y += 0.01;
			var distance = Math.round(Math.sqrt(Math.pow(sucette.mesh.position.x-game.user.mesh.position.x,2) + Math.pow(sucette.mesh.position.y-game.user.mesh.position.y,2) + Math.pow(sucette.mesh.position.z-game.user.mesh.position.z,2)));
			if(distance <= 110){
				game.MakeUserAbleToHunt();
				if(sounds['catch_sucette'].isEnded)
		    			sounds['catch_sucette'].load().play();
				game.scene.remove(sucette.mesh);
				this.sucettes.splice(i,1);
			}
		}
	}
}

var BullesManager = function(opts){
	this.bulles = [];
	this.create = function(x,y,z,t,game){
		var sphereGeom = new THREE.SphereGeometry(t, 32, 16); // radius, segmentsWidth, segmentsHeight

		var mirrorSphereCamera = new THREE.CubeCamera(0.1, 5000, 512);
		var mirrorSphereMaterial = new THREE.MeshBasicMaterial({
			envMap: mirrorSphereCamera.renderTarget,
			color: 0xFFFFFF,
			transparent: true,
			opacity: 0.7
		});

		var mirrorSphere = new THREE.Mesh(sphereGeom, mirrorSphereMaterial);

		mirrorSphere.position.set(x, y, z);
		mirrorSphereCamera.position = mirrorSphere.position;

		game.scene.add(mirrorSphere);

		game.scene.add(mirrorSphereCamera);
		mirrorSphereCamera.updateCubeMap(game.renderer, game.scene);
		this.bulles.push({
			sphere: mirrorSphere,
			camera: mirrorSphereCamera,
			realPos: new THREE.Vector3(x, y, z),
			velocity: new THREE.Vector3(0, 0, 0),
			position: new THREE.Vector3(0, 0, 0),
			wanderAngle: Math.random()*380+15,
			fearMode: false
		});
	}

	this.animate = function(game){
		//dispersion des bulles
		for (var i = 0; i < this.bulles.length; i++) {
			var bulle = this.bulles[i];
			//sqrt[(Xa-Xb)²+(Ya-Yb)²+(Za-Zb)²]
			var distance = Math.round(Math.sqrt(Math.pow(bulle.sphere.position.x-game.user.mesh.position.x,2) + Math.pow(bulle.sphere.position.y-game.user.mesh.position.y,2) + Math.pow(bulle.sphere.position.z-game.user.mesh.position.z,2)));
			if(distance <= 110){
				if(game.userAbleToHunt){
					if(sounds['bulle_destroyed'].isEnded)
		    				sounds['bulle_destroyed'].load().play();
					game.scene.remove(bulle.sphere);
					this.bulles.splice(i,1);
					if(Object.size(game.bullesManager.bulles) == 0){
						game.user.win();
					}
				}else{
					game.user.die();
				}
				break;
			}
			if(bulle.fearMode == false && distance <= 400){
				bulle.sphere.material.color.setHex(0xFF4500);
				bulle.fearMode = true;
			}else if(bulle.fearMode == true && distance > 450){
				bulle.sphere.material.color.setHex(0xFFFFFF);
				bulle.fearMode = false;
			}
			if(bulle.fearMode == true){
				if(game.userAbleToHunt){
					var pos = WalkBehavior.flee(bulle.sphere.position, game.user.mesh.position, 5);
				}else{
					var pos = WalkBehavior.seek(bulle.sphere.position, game.user.mesh.position, 8);
				}
				bulle.sphere.position.x = pos.x;
				bulle.sphere.position.z = pos.z;
			}else if(bulle.fearMode == false && distance >= 450 && (bulle.sphere.position.x != bulle.realPos.x || bulle.sphere.position.z != bulle.realPos.z) && ((bulle.sphere.position.x >= 3000 || bulle.sphere.position.x <= -3000) || (bulle.sphere.position.z >= 3000 || bulle.sphere.position.z <= -3000))){
				bulle.sphere.translateX(bulle.realPos.x-bulle.sphere.position.x);
				bulle.sphere.translateZ(bulle.realPos.z-bulle.sphere.position.z);
			}
		}
	}

	this.renderCams = function(){
		for (var i = 0; i < this.bullesManager.bulles.length; i++) {
			var mirrorSphereCamera = this.bullesManager.bulles[i].camera;
			mirrorSphereCamera.updateCubeMap(this.renderer, this.scene);
		}
	}

}


var WalkBehavior = {

	getVelocity: function(position, target, speed){
		position = new THREE.Vector3().copy(position);
		target = new THREE.Vector3().copy(target);

		var velocity = target.sub(position).normalize().multiplyScalar(speed);
		var desired_velocity = new THREE.Vector3().copy(velocity);
		var steering = desired_velocity.sub(position);
		steering = WalkBehavior.truncate(steering, 0.4);
		velocity = WalkBehavior.truncate(velocity.add(steering), speed);

		return {velocity:velocity, position:position, target:target};
	},
	seek: function(position, target, speed){
		var el = WalkBehavior.getVelocity(position, target, speed);
		return el.position.add(el.velocity);
	},
	flee: function(position, target, speed){
		var el = WalkBehavior.getVelocity(position, target, speed);
		return el.position.add(el.velocity.negate());
	},
	wander: function(position, angle, speed){


	},
	truncate: function(v, max){
		var i = max/v.length();
		i = i < 1.0 ? i : 1.0;
    		return v.multiplyScalar(i);
	}
};

var Environment = function(opts){
	this.init = function(scene){
		var textureCube = THREE.ImageUtils.loadTextureCube(urlsPaysage);

		var gt = THREE.ImageUtils.loadTexture(elements['texturesol']);
		var gg = new THREE.PlaneGeometry(16000, 16000);
		var gm = new THREE.MeshPhongMaterial({
			color: 0xffffff,
			map: gt
		});

		var ground = new THREE.Mesh(gg, gm);
		ground.rotation.x = -Math.PI / 2;
		ground.material.map.repeat.set(64, 64);
		ground.material.map.wrapS = ground.material.map.wrapT = THREE.RepeatWrapping;
		ground.receiveShadow = true;

		scene.add(ground);

		var light = new THREE.PointLight(0xffffff, 1);

		light.position.set(0, 1000, 0);
		scene.add(light);

		var light2 = new THREE.DirectionalLight(0xffffff, 1.5);
		light2.castShadow = true;

		light2.position.set(0, 1, 1).normalize();
		scene.add(light2);

		var shader = THREE.ShaderLib["cube"];
		shader.uniforms["tCube"].value = textureCube;

		var material = new THREE.ShaderMaterial({

			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			side: THREE.BackSide

		});

		mesh = new THREE.Mesh(new THREE.CubeGeometry(6000, 6000, 6000), material);
		scene.add(mesh);
	}
}

var Lapin = function(){
	this.loader;
	this.mesh;
	this.direction;
	this.duration = 1000;
	this.currentFrame, this.lastKeyFrame, this.keyframes = 24, this.interpolation = this.duration / this.keyframes;

	this.init = function(scene, callback){
		this.direction = new THREE.Vector3(0, 0, 0);

		this.loader = new THREE.JSONLoader(true);
		var me = this;
		this.loader.load(elements['lapin'], function (geometry,mat) {

			me.mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
				color: 0xffffff,
				morphTargets: true
			}));
			me.mesh.scale.set(14, 14, 14);
			me.mesh.castShadow = true;
			scene.add(me.mesh);
			callback();
		});
	} 

	this.die = function(){
		if(game.alive){
			game.alive = false;
			if(sounds['die'].isEnded)
				sounds['die'].load().play();
			game.lives--;
			if(game.lives == 0){
				this.lost();
			}else{
				$('#die').fadeIn(500, function(){
					game.user.mesh.position.set(0,0,0);
				}).delay(3000).fadeOut(500, function(){
					game.MakeUserAbleToHunt(5);
					game.alive = true;
				});
			}
		}
	}

	this.lost = function(){
		$('#die h1').html('Vous avez perdu ! <a href="javascript:window.location.reload();">Recommencer ?</a>');
		$('#die').fadeIn(500);
		game.canBeAnimated = false;
	}

	this.win = function(){
		$('#win').fadeIn(500);
		game.canBeAnimated = false;
	}

	this.setDirection = function(ctrl){
	        var x = ctrl.left ? 1 : ctrl.right ? -1 : 0, y = 0, z = ctrl.up ? 1 : ctrl.down ? -1 : 0;
	        this.direction.set(x, y, z);
    	}

	this.motion = function(){
		if (this.direction.x !== 0 || this.direction.z !== 0) {
			// Rotate the character
			this.rotate();
			this.testBoundaries();
			this.move();
			return true;
		}
	}

	this.testBoundaries = function(){
		if(this.direction.x == 1 && this.mesh.position.x >= 2960) this.direction.x = 0;
		if(this.direction.x == -1 && this.mesh.position.x <= -2960) this.direction.x = 0;
		if(this.direction.z == 1 && this.mesh.position.z >= 2960) this.direction.z = 0;
		if(this.direction.z == -1 && this.mesh.position.z <= -2960) this.direction.z = 0;
	}

	this.rotate = function(){
		var angle = Math.atan2(this.direction.x, this.direction.z),
		difference = angle - this.mesh.rotation.y;
		if (Math.abs(difference) > Math.PI) {
		if (difference > 0) {
			this.mesh.rotation.y += 2 * Math.PI;
		} else {
			this.mesh.rotation.y -= 2 * Math.PI;
		}
		difference = angle - this.mesh.rotation.y;
		}
		if (difference !== 0) {
			this.mesh.rotation.y += difference / 4;
		}
	}

	this.move = function(){
		this.mesh.position.x += this.direction.x * ((this.direction.z === 0) ? 8 : Math.sqrt(16));
        		this.mesh.position.z += this.direction.z * ((this.direction.x === 0) ? 8 : Math.sqrt(16));

        		this.animate();
	}

	this.animate = function(){
		var time = Date.now() % this.duration;

		var keyframe = Math.floor(time / this.interpolation);

		if (keyframe != this.currentKeyframe) {

			this.mesh.morphTargetInfluences[this.lastKeyframe] = 0;
			this.mesh.morphTargetInfluences[this.currentKeyframe] = 1;
			this.mesh.morphTargetInfluences[keyframe] = 0;

			this.lastKeyframe = this.currentKeyframe;
			this.currentKeyframe = keyframe;

			// console.log( mesh.morphTargetInfluences );

		}

		this.mesh.morphTargetInfluences[keyframe] = (time % this.interpolation) / this.interpolation;
		this.mesh.morphTargetInfluences[this.lastKeyframe] = 1 - this.mesh.morphTargetInfluences[keyframe];
	}
}

function animate() {

	requestAnimationFrame( animate );

	game.animate();

}