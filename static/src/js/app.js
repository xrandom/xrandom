var App = function() {
    var LOWER_BOUND = 5;

    this.players = [];
    this.fetcher = new Fetcher(Config.backend, LOWER_BOUND);
    this.filter = '';
    this.menuToggled = false;

    this.classNames = {
        playerContainer: 'player-container',
        playerControlsMany: 'player-controls__many',
        fullBtn: 'player-button_full',
        btnNext: 'player-button',
        btnPin: 'player-button',
        btnClose: 'player-button player-button__close',
        menuClosed: 'app_menu-closed',
    };

    this.init = function() {
        this.$app = $('.js-app');
        this.$videoContainer = $('.js-video-container');
        this.$videos = $('.js-videos');
        this.$up = $('.js-up-mode');
        this.$filter = $('.js-filter');
        this.$applyFilter = $('.js-apply-filter');
        this.$toggleMenu = $('.js-toggle-menu');
        this.$menu = $('.js-menu');
        this.$playerControls = $('.js-player-controls');
        this.$pinHint = $('.js-about-pin');

        this.$up.click(this.addPlayer.bind(this, null, null));
        this.$applyFilter.click(this.updateFilter.bind(this));
        this.$filter.keypress(function(e) {
            if (e.which === 13) {
                this.updateFilter();
            }
        }.bind(this));
        this.$toggleMenu.click(this.toggleMenu.bind(this));

        if(window.location.hash) {
            this.loadByHash();
        } else {
            this.addPlayer();
        }

        this.$pinHint.click(function() {
            alert('Pinned video doesn\'t change while searching. You can pin video in one window and search anything in another window.');
        });

        $(window).on('hashchange', this.loadByHash.bind(this));
    };

    this.loadByHash = function() {
        var promises = [];
        var items = window.location.hash.slice(1).split(',');

        if (!$.isNumeric(items[items.length - 1])) {
            this.filter = decodeURIComponent(items[items.length - 1]);
            this.$filter.val(this.filter);
        }

        for (var i = 0; i < items.length; ++i) {
            if ($.isNumeric(items[i])) {
                if (this.players[i]) {
                    if (this.players[i].player.getPlayingId() != items[i]) {
                        this.players[i].player.play(items[i]);  
                    }                    
                } else {
                    promises.push(this.addPlayer(items[i], true));
                }
            }
        }   

        for (var j = i; j < this.players.length; j++) {
            this.removePlayer(this.players[j], true);
        }

        $.when.apply($, promises).then(function() {
            this.resize();
            this.changeInterface();
        }.bind(this));
    };

    this.addPlayer = function(id, silent) {
        var $container = $('<div />').addClass(this.classNames.playerContainer);
        return $.when(
            id ||this.fetcher.getId(this.filter), 
            this.fetcher.getId(this.filter)
        )
        .then(this._addPlayerWithIds.bind(this, $container, silent));
    };

    this.next = function(player) {
        var filter = player.pinned ? player.filter : this.filter;
        $.when(
            this.fetcher.getId(filter)
        )
        .done(function(id) {
            player.player.next(id);
            this.updateHash();
        }.bind(this));
    };

    this.togglePin = function(player) {
        player.pinned = !player.pinned;
        player.filter = this.filter;
        
        if (player.pinned) {
            player.pinButton.text('Unpin');        
        } else {
            player.pinButton.text('Pin');
        }
    };


    this._addPlayerWithIds = function($container, silent, playId, prepareId) {
        var $nextButton = $('<button />').addClass(this.classNames.btnNext).text('Next');
        var $pinButton = $('<button />').addClass(this.classNames.btnPin).text('Pin');        
        var $closeButton = $('<button />').addClass(this.classNames.btnClose).text('×');        
        
        var $controlContainer = $('<li />').addClass(this.classNames.control);

        var player = {
            container: $container,
            controlContainer: $controlContainer,
            player: new Player($container, playId, prepareId),
            nextButton: $nextButton,
            pinButton: $pinButton,
            closeButton: $closeButton,
            loading: false
        };

        this.players.push(player); 
        
        this.$videoContainer.append($container);

        $controlContainer.append($nextButton);
        $controlContainer.append($pinButton);
        $controlContainer.append($closeButton);
        this.$playerControls.append($controlContainer);

        $nextButton.click(this.next.bind(this, player));
        $pinButton.click(this.togglePin.bind(this, player));
        $closeButton.click(this.removePlayer.bind(this, player, null));

        if (!silent) {
            this.resize();
            this.changeInterface();
            this.updateHash();        
        }
    };

    this.changeInterface = function() {
        if (this.players.length == 1) {
            this.players[0].closeButton.hide();
            this.players[0].pinButton.hide();
            this.players[0].nextButton.text('Show next video');
            this.players[0].nextButton.addClass(this.classNames.fullBtn);
            this.$playerControls.removeClass(this.classNames.playerControlsMany);
            this.$pinHint.hide();
        } else {
            this.players[0].closeButton.show();
            this.players[0].pinButton.show();
            this.players[0].nextButton.text('Next');
            this.players[0].nextButton.removeClass(this.classNames.fullBtn);
            this.$playerControls.addClass(this.classNames.playerControlsMany);
            this.$pinHint.show();
        }
    };

    this.resize = function() {
        var width = this.$videoContainer.width();
        var height = this.$videoContainer.height();

        var coefWidth = Math.ceil(Math.sqrt(this.players.length));
        var coefHeight = Math.round(Math.sqrt(this.players.length));

        var videoWidth = Math.floor(width / coefWidth);
        var videoHeight = Math.floor(height / coefHeight);

        for (var i = 0; i < this.players.length; ++i) {
            this.players[i].container.css({
                width: videoWidth,
                height: videoHeight
            });
        }
    };

    this.removePlayer = function(player, silent) {
        var removeIndex = this.players.indexOf(player);

        player.container.remove();
        player.controlContainer.remove();

        var players = [];

        for (var i = 0; i < this.players.length; ++i) {
            if (i == removeIndex) {
                continue;
            }
            players.push(this.players[i]);
        }

        this.players = players;

        if (!silent) {
            this.resize();  
            this.changeInterface();
            this.updateHash();     
        }
    };

    this.updateFilter = function() {
        var filter = $.trim(this.$filter.val());
        this.$filter.val(filter);

        if (filter != this.filter) {
            this.filter = filter;

            $.when(this.fetcher.getId(this.filter))
            .then(function(test_id) {
                if (!test_id) {
                    return this.notFound();
                }

                for (var i = 0; i < this.players.length; ++i) {
                    if (this.players[i].pinned) {
                        continue;
                    }

                    (function(i) {
                        $.when(this.fetcher.getId(this.filter))
                        .then(function(id) {
                            this.players[i].player.play(id);
                            this.updateHash();
                        }.bind(this));              

                        var laterPreload = function(i) {
                            return function() {
                                $.when(this.fetcher.getId(this.filter))
                                .then(function(id) {                                
                                    this.players[i].player.prepare(id)
                                }.bind(this));                      
                            }.bind(this);
                        }.bind(this);   

                        setTimeout(laterPreload(i), 100);
                    }.bind(this))(i);
                }
            }.bind(this));
        } else {
            for (var i = 0; i < this.players.length; ++i) {
                if (this.players[i].pinned) {
                    continue;
                }

                $.when(this.fetcher.getId(this.filter))
                .done(function(id) {
                    this.players[i].player.next(id);
                    this.updateHash();
                }.bind(this));                     
            }
        }
    };

    this.toggleMenu = function() {
        this.menuToggled = !this.menuToggled;
        this.$app.toggleClass(this.classNames.menuClosed);
        if (this.menuToggled) {
            this.$toggleMenu.text('→');
        } else {           
            this.$toggleMenu.text('←');
        }
        this.resize();
    };

    this.notFound = function() {
        alert('Videos not found');
    };

    this.updateHash = function() {
        var ids = this.players.map(function(player) {
            return player.player.getPlayingId();
        }).join(',');

        window.location.hash = ids + (this.filter ? ',' + this.filter : '');
    };

    this.init();
    $(window).resize(this.resize.bind(this));
};

$(function() {
    new App();
});
