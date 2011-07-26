jQuery(function($) {
/***
Fusion Table Builder
--------------------

This is a port of Google's [Fusion Table Layer Builder](http://gmaps-samples.googlecode.com/svn/trunk/fusiontables/fusiontableslayer_builder.html), using jQuery, Backbone and Underscore, with the aim of integrating it into the WordPress admin.
***/

// a query utility

function query(sql, callback, errback) {
    var base = "https://www.google.com/fusiontables/api/query?";
    var url = base + $.param({sql: sql});
    $.ajax({
        url: url,
        dataType: 'jsonp',
        jsonp: 'jsonCallback',
        success: callback,
        error: errback
    });
};


/***
Models
***/

/***
**FTLayer**: 

Stores basic data about a Fusion Table:

 - table_id
 - location_column
 - filter

***/

var FTLayer = Backbone.Model.extend({
    
    defaults: {
        table_id: null,
        location_column: null,
        filter: null
    }
})


/***
Collections

**LayerCollection**:
***/

var LayerCollection = Backbone.Collection.extend({
    
    model: FTLayer,
    
    complete: function() {
        return this.filter(function(layer) {
            !!(layer.get('table_id') && layer.get('filter'));
        });
    }
});

window.layers = new LayerCollection;

/***
Views
***/

var LayerView = Backbone.View.extend({
    
    className: ".layer",
    
    events: {
        'change input.table_id': 'setColumns',
        'click a.delete'       : 'remove'
    },
    
    template: _.template( $('#layer-template').html() ),
    
    initialize: function(options) {
        _.bindAll(this, 'render', 'remove', 'setColumns');
        
        this.model.view = this;
        this.render();
        return this;
    },
    
    remove: function(e) {
        e.preventDefault();
        $(this.el).remove();
        return this;
    },
    
    render: function() {
        $(this.el).html(this.template(this.model.toJSON()));
        return this;
    },
    
    setColumns: function() {
        var that = this;
        var table_id = this.$('input.table_id').val();
        if (!table_id) return;
        
        var sql = "SELECT * FROM " + table_id + " LIMIT 1";
        query(sql, function(resp) {
            var columns = resp.table.cols;
            var select = that.$('select.location_column');
            select.empty();
            for (var key in columns) {
                var column = columns[key];
                var option = $('<option/>')
                    .attr('value', column)
                    .text(column);
                select.append(option);
            }
            that.model.set({
                table_id: table_id,
                columns: columns
            });
            select.focus();
        })
        return this;
    },
    
});

var MapView = Backbone.View.extend({
    
});

window.AppView = Backbone.View.extend({
    
    el: $('#ft-builder'),
    
    events: {
        'click input.new-layer': 'createLayer'
    },
    
    initialize: function(options) {
        _.bindAll(this, 'addLayer', 'render');
        layers.bind('add', this.addLayer);
        
        if (!layers.length) {
            var layer = new FTLayer;
            layers.add(layer);
        }
        
        return this;
    },
    
    // hook for when layers are added to a the layers collection
    // by user click or refresh
    addLayer: function(layer) {
        var view = new LayerView({ model: layer });
        this.$('#layers').append(view.el);
        return this;
    },
    
    // method to create a layer when a user clicks the Add Layer button
    createLayer: function(e) {
        var layer = new FTLayer;
        layers.add(layer);
        return layer;
    },
    
    render: function() {}
    
});

window.ft_builder = new AppView;

});