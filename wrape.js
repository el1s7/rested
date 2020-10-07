function Wrape(endpoints,global_options){
	
	//Parse Global Options
	endpoints = endpoints || {};
	
	var default_global = {
		"base": "",
		"headers":{},
		"params":{},
		"agent": false, //node-fetch, able to add proxy
	}
	
	global_options = Object.assign(default_global,global_options);
	
	function ajax(url, options,type) {
		return fetch(url, options)
			.then(async function(res){
				if (!res.ok) {
					return Promise.reject(res);
				}
				var content_type = res.headers.get('Content-Type');
				var resobj = {
					'status_code': res.status,
					'status': res.status,
					'statusText': res.statusText,
					'headers': res.headers,
				}
				if(content_type && (new RegExp("application\/json")).test(content_type)){resobj['json'] = await res.json();}
				else if(content_type && (new RegExp("text\/")).test(content_type)){resobj['text'] = await res.text();}
				else{resobj['arrayBuffer'] = await res.arrayBuffer()}
				
				return resobj
			});
	}
	
	//The set constructor
	function newSetObject(root){
		return (function(def_values){
			this.def_values = def_values;
			Object.assign(this,root);
			
			//Set for the current initalized object
			var setter = (function(def_values){
				if ((this instanceof setter)) { throw new Error("You can't initalize this object.");}
				this.def_values = def_values;}
				).bind(this);
			this.set = setter;
			
			
			return this;
		});
	}
	
	function isNull(value){
		return value === null || value === undefined;
	}
	
	function isEmptyIterable(iterable){
		for (var _ of iterable) {
			return false;
		}
	
		return true;
	};
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
	

	
	function fetcher(request){
		
		request.method = (typeof request.method === "string" ? request.method.toUpperCase() : "GET");
		
		
		var allowed_param_locations = ["headers","body","query","path"];
		var allowed_param_enctypes = ['multipart/form-data','application/x-www-form-urlencoded'];
		request.enctype = ((request.enctype && allowed_param_enctypes.includes(request.enctype)) ? request.enctype : allowed_param_enctypes[0]);
		
		var def_param_locations = {
			'POST': 'body',
			'GET': 'query',
		}
		
		
		return async function(params){
			var url = `${global_options.base}${request.path}`;
			var options = {
				method: request.method,
				headers: global_options.headers,
				agent: global_options.agent
			}
			
			
			request_params = Object.keys(request.params);
			argument_params = Array.from(arguments);
			
			//Parse the params object
			//Support passing parameters like arguments, instead of object. (Not recommended for multiple elements)
			if(argument_params.length > 1){
				params = argument_params.reduce(function(o,k,i){
					if(!request_params[i]){
						return o;
					}
					o[request_params[i]] = k;
					return o;
				},{});
			}
			else if(argument_params.length == 1 && request_params.length == 1 && typeof argument_params[0] !== "object"){
				params = {
					[request_params[0]]: argument_params[0]
				}
			}
			else{
				params = params || {};
			}
			
	
			this.def_values = this.def_values || {};
			var body =  ((request.enctype == allowed_param_enctypes[0]) ? new FormData() : new URLSearchParams());
			var query = new URLSearchParams();
			
	
			for (var param_name in request.params){
				var param = request.params[param_name];
				var param_value = params[param_name] || this.def_values[param_name] || global_options.params[param_name] || param.default;
				var param_dest = param.name || param_name;
				
				//Required Param or not
				if(param.required && isNull(param_value)){ throw new Error(param.help || `The '${param_name}' field is required.`);}
	
				//Skip, not required
				if(isNull(param_value)) continue;
				
				//Formatter function?
				if(typeof param.format === "function"){param_value = param.format(param_value);}
				
				//Validate
				if(param.validate && !(new RegExp(param.validate).test(param_value))){ throw new Error(param.help || `The '${param_name}' field is invalid.`);}
	
				//Location
				var param_location = (typeof param.location === "string" ? param.location.toLowerCase() : def_param_locations[options.method]);
				if(!param_location || !allowed_param_locations.includes(param_location)){ throw new Error(`Invalid location for '${param_name}' field.`);}
				
	
				if(param_location == "headers"){
					options['headers'] = options['headers'] || {};
					options['headers'][param_dest] = param_value;
					continue;
				}
				if(param_location == "body"){
					body.append(param_dest,param_value);
					continue;
				}
				if(param_location == "query"){
					query.append(param_dest,param_value);
					continue;
				}
				if(param_location == "path"){
					url = url.replace(new RegExp(`\:${escapeRegExp(param_name)}`),param_value);
				}
			}
			query = query.toString();
			
			if(query){
				url = `${url}?${query}`;
			}
	
			if(!isEmptyIterable(body.keys())){
				options['body'] = ((request.enctype == allowed_param_enctypes[0]) ? body : body.toString());
			}
	
			return ajax(url,options);
		}
	}
	
	function ocreater(root,tree,ne=false){
		for(var category in tree){
			var category_tree = tree[category];
			
			//Is Endpoint
			if(category_tree.hasOwnProperty('path')){
				var request = category_tree;
				root._ne = true; //Not empty
				
				//Skip duplicate keys in main object root
				if(typeof root[category] !== "undefined"){
						console.warn(`Skipping ${category} as it confilicts with another key in the object, avoid using keys like ('set') because they are reserved constructor words.`);
						continue;
				}
				root[category] = fetcher(request);
		
			}
			//Is Category, recursion
			else{
				root[category] = ocreater({},category_tree)
			}
		}
		
		//If it has endpoints , add the 'set' constructor function.
		root = (root._ne) ? Object.assign(root,{'set': newSetObject(root)}) : root;
		
		return root;
	}
	return ocreater({},endpoints,true);
}

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Wrape = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
    return Wrape;
}));