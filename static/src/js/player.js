var Player = function(element, playId, prepareId) {

    var IFRAME_URL = "http://www.eporner.com/embed/{id}"; 
    var IFRAME_PATTERN = '<iframe width="100%" height="100%" frameborder="0" allowfullscreen/>';

    this.classNames = {
        playing: 'playing-iframe',
        preparing: 'preparing-iframe'
    };

    this.playingId;
    this.preparingId;
    
    this.init = function() {
        this.$element = $(element);
        this.$playing = $(IFRAME_PATTERN).addClass(this.classNames.playing);
        this.$preparing = $(IFRAME_PATTERN).addClass(this.classNames.preparing);

        this.$element.append(this.$playing);
        this.$element.append(this.$preparing);

        this.play(playId);
        setTimeout(this.prepare.bind(this, prepareId), 500);
    };

    this.getPlayingId = function() {
        return this.playingId;
    };

    this.getPreparingId = function() {
        return this.playingId;
    };    

    this.getElement = function() {
        return this.$element;
    };

    this._setVideo = function(id, $iframe) {
        if ($iframe.get(0).contentWindow) {
            $iframe.get(0).contentWindow.location.replace(IFRAME_URL.replace('{id}', id));
        } else {
            $iframe.attr('src', IFRAME_URL.replace('{id}', id));
        }
    };

    this.prepare = function(id) {
        this.preparingId = id;
        this._setVideo(id, this.$preparing);
    };

    this.play = function(id) {
        this.playingId = id;
        this._setVideo(id, this.$playing);
    };

    this.next = function(id) {
        this.$preparing
            .addClass(this.classNames.playing)
            .removeClass(this.classNames.preparing);
        
        this.$playing
            .removeClass(this.classNames.playing)
            .addClass(this.classNames.preparing);
 
        var temp = this.$playing;
        this.$playing = this.$preparing;
        this.$preparing = temp; 

        this._setVideo(id, this.$preparing);

        this.playingId = this.preparingId;
        this.preparingId = id;
    };

    this.init();
};  
 
