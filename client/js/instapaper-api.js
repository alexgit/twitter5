function InstaPaperClient(username, password) {
	var apiURL = "https://www.instapaper.com/api/add";

	this.username = username;
	this.password = password;

	this.addURL = function(url) {

		var cb, fcb;
		var self = this;

		function myCallback(response) {
			console.log(response);
		}

		function runIfReady() {			
			if(!cb || !fcb) {
				return;
			}

			var params = {
				username: self.username,
				password: self.password,
				url: url
			};
		
			$.ajax({
				url: apiURL,
				dataType: 'jsonp',
				data: params,
				complete: function(jqXHR, textStatus) {
					var callback = jqXHR.status === 200 ? cb : fcb;
					callback(jqXHR, textStatus);					
				}
			});
		}

		var callbacks = {
			done: function(successCallback) {
				if(typeof successCallback !== 'function')
					throw "successCallback must be a function";

				cb = successCallback;
				runIfReady();

				return this;
			},
			fail: function(failCallback) {
				if(typeof failCallback !== 'function')
					throw "failCallback must be a function";

				fcb = failCallback;
				runIfReady();

				return this;
			}
		};

		return callbacks;
	}
};
