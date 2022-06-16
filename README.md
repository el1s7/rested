  

# Rests

Easily generate API client's SDK — organize and simplify API Requests.



### An API Request with Rests✅

```javascript
api.login({
	user: 'test',
	password: 'test'
})
.then(({json})=>(
	console.log(`Logged in!`)
));
```

### Normal API Request❌
 ```javascript
fetch("https://example.com/login",{
	'method': 'POST',
	'headers': {
		'Content-Type': 'application/x-www-form-urlencoded'
	},
	'data': `user=${user}&password=${password}`
}).then((res) => (if(!res.ok){ return Promise.reject("error"))})
.then((res) => res.json())
.catch((err) => console.warn)
.then(data)=> (console.log("Finally the response")));
```

## Features

- One source of truth for all your API requests
- Robust configuration, makes it easier to handle authentication and prevent repetition of parameters
- Split requests into multiple categories/subcategories
- Generate Typescript types for your API automatically
- Generate a simple markdown reference automatically
- Supports schema from pure JSON 
- Universal support - works on Browsers & Node.js

& more


  
## Installation

`npm i rests`

You should also install it globally in order to easily run the cli.

`npm i rests -g`

  
## Usage
```javascript
import Rests from 'rests';

const API = Rests({
	$options: {
		base: 'https://example.com'
	},
	user:{
		login:{
			path: '/user/login',
			method: 'POST',
			params:{
				username:{
					required: true,
					type: "string",
					help: "A valid username is required",
					validate: /\w+/
				},
				password: {
					required:  true,
					help: "A valid password is required",
					type: "string",
					
					format: (password) => { 
						if(password.length < 8){
							throw new Error("The password must be at least 8 characters.");
						}
						return password;
					}

				}
			}
		},
		profile: {
			$options:{
				params:{
					//Set authentication parameters for all requests in this category
					authorization: {...} 
				}
			}
			info: {
				...
			},
			update: {
				...
			}
		}
	}
});

export default API;

```

### Then you can call your API like this

```javascript
import API from './API.js';

API.user.login({
	username: 'nice',
	password: 'mypassword'
})
.then((res)=>{
	console.log(res.json);
	//Successful Response, body automatically parsed.
})
.catch((res)=>{
	console.log(res.json || res.message);
	//Error Response 
})
```

### Example Validation error
```javascript
import API from './API.js';

API.user.login({
	username: 'john', 
	password: 'tooshort'
}).catch((err) => {
	console.log(err.field, err.message); 
	//Prints: password The password must be at least 8 characters.
});

```
### Setting Variables
You can set default parameter variables for all requests in a category by initializing it with the `set` function. 

```javascript
const User = new api.user.set({
	authorization: 'user_auth_token'
}); 
```

You can also update the options for a category by using the special `$options` key. 
```javascript
const User = new api.user.set({
	$options: {
		on_error: (error)=>{
			if(error?.statusCode == 401){
				alert("Session has expired");
			}
		}
	}
}); 
```

## CLI Usage
Rests comes with a simple CLI for generating types and API markdown reference.

Generate the types file `./api.d.ts` automatically and watch for changes
```bash
> rests ./api.js --types --watch
```


Generate the markdown API refrence
```bash
> rests ./api.js --docs
```

##  Projects using Rests 
[TikAPI](https://tikapi.io) is using Rests:

- https://github.com/tikapi-io/tiktok-api



## Schema Reference

#### Categories
 An API category is an object consisting of [Endpoint Object](#endpoint-object)s or subcategories.
A category can also contain these special keys:
  - **`$options`**: Options for this category and it's subcategories, overriding other options. See [Options](#options)
  - **`$help`**:  A  description of the category.

#### Endpoint Object
 - **`path`**: The request path or full URL, which can also contain named parameters,  check [exmaple](#another-example) below. 
  - **`method`**: The request method, GET,POST etc. *(default: GET)*
  - **`enctype`**: The body encode type for \*only for *requests that have body* parameters:
	 - **`json`**` (application/json)` *(default)*
	 - **`form`**` (multipart/form-data)` 
	 - **`urlencode`**` (application/x-www-form-urlencoded)`
  - **`params`**: An object consisting of [Params Object](#params-object)s.
  - **`help`**: A description of this endpoint
  - **`example_response`**: Example response used for documentation generation
  - **`on_success`**: See [Options](#options) 
  - **`on_error`**: See [Options](#options)
  - **`on_request`**: See [Options](#options)
 

#### Params Object
 - **`name`**: The parameter HTTP name, this defaults to the object key name.
 - **`required`**: `boolean` *(default: false)*.
 - **`help`**: A helpful message to throw if the parameter is invalid.
 - **`type`**: Supported types:
     - **`"string"`** 
     - **`"number"`** 
     - **`"array"`** 
     - **`"object"`** 
     - **`"boolean"`** 
     - **`"any"`** *(default)*

 - **`format`**: A function to format the parameter value, or throw an error if it's invalid.
 - **`validate`**: Regex validation.
 - **`in`**:  Array of valid allowed values
 - **`default`**: A default value.
 - **`location`**: The location where this parameter will be in the HTTP request fields:
     - **`body`** the param will be included in request body *(default for POST request)*
     - **`query`** the param will be URL encoded in request URL query *(default for GET request)*
     - **`headers`** the param will be included in request headers
     - **`path`** the param will be included in request path
       - Note: You must also declare the named parameter key in the Endpoint path like `/get/{key}`. 
  - **``example``** : Example values used for documentation generation

###  Options
The options object can be defined in every category using the special `$options` key.

`Rested(endpoints, options?)`
  - **`base`**: This will be prepended before each requests path. (e.g `https://example.com`)
  - **`headers`**: Key-value object of headers to include in all requests
  - **`params`**: Params to include in all requests
  - **`values`**: Key-value object store to set default values for all parameters
  - **`on_request`**: A global hook function that is called before each request. Accepts an object of `{url, options}`.
	
	To modify the request:
	```javascript 
	return {url, options}
	``` 
	
	To prevent the request from sending:
	```javascript 
	return false
	```

  - **`on_success`**: A hook function that is called on successful response, you can also modify and return a different response. Accepts `(response, request)`.
  - **`on_error`**: A hook function that is called on errors. Accepts `(error_response, request)`. You can also return a new error like this:
	```javascript
	return Promise.reject(CustomErrorResponse)
	```
  - **`fetch_agent`**: You can use this option to configure proxy if you're using node-fetch. 