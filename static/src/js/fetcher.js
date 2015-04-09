var Fetcher = function(url, lowerBound) {

    this.ids = {
        '': []
    };

    this.ended = {};

    this.used = {
        '': []
    };

    this.searched = {};

    this.lowerBound = lowerBound;
    this.filter = '';

    this.loadingPromise = null;

    this.getId = function(filter) {
        this.ids[filter] = this.ids[filter] || [];
        this.used[filter] = this.used[filter] || [];
        
        var value = this.ids[filter].shift();           
        var loadingPromise;

        if (this.ended[filter]) {
            if (value === undefined) {
                this.ids[filter] = this.used[filter].slice();
                value = this.ids[filter].shift();
            }

            return value;
        }

        if (this.ids[filter].length < this.lowerBound) {
            loadingPromise = this._fetch(filter);
        }
    
        if (value === undefined && !this.searched[filter]) {
            return loadingPromise.then(function() {
                this.searched[filter] = true;
                return this.getId(filter);    
            }.bind(this));
        } else if (value !== undefined) {
            this.used[filter].push(value);
        }

        return value;
    };

    this._fetch = function(filter) {
        var state = this.state;
        return $.get(url + '/' + filter)
            .then(function(data) {
                var count = 0;
                var ids = data.ids;
                for (var i = 0; i < ids.length; ++i) {
                    if (this.used[filter].indexOf(ids[i]) == -1 && 
                        this.ids[filter].indexOf(ids[i]) == -1) {
                       this.ids[filter].push(ids[i]);   
                       count++; 
                    }
                }

                if (count == 0 && this.used[filter].length != 0) {
                    this.ended[filter] = true;
                }
            }.bind(this)); 
    };
};
