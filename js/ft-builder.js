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

// a singleton to hold map options
var MapOptions = Backbone.Model.extend({
    
    defaults: {
        height: 400,
        width: 600,
        zoom: 6,
        center: "0,0"
    },
    
    fieldnames: ['height', 'width', 'center', 'zoom']
    
});

/***
Collections

**LayerCollection**:
***/

var LayerCollection = Backbone.Collection.extend({
    
    model: FTLayer,
    
    complete: function() {
        return this.filter(function(layer) {
            return (layer.has('table_id') && layer.has('location_column'));
        });
    }
});

window.layers = new LayerCollection;

/***
Views
***/

var LayerView = Backbone.View.extend({
    
    className: "layer",
    
    events: {
        'change input.table_id': 'getColumns',
        'change select.location_column': 'setGeoColumn',
        'click a.delete'       : 'remove'
    },
    
    template: _.template( $('#layer-template').html() ),
    
    initialize: function(options) {
        _.bindAll(this);
        
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
    
    getColumns: function() {
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
    
    setGeoColumn: function(e) {
        var column = this.$('select.location_column').val();
        if (column) this.model.set({location_column: column});
        
        // return this regardless
        return this;
    }
    
});

window.AppView = Backbone.View.extend({
    
    el: $('#ft-builder'),
    
    events: {
        'click input.new-layer': 'createLayer',
        'click input.update-map': 'render_map'
    },
    
    jsTemplate: _.template( $('#map-embed-template').html() ),
    
    initialize: function(options) {
        _.bindAll(this);
        layers.bind('add', this.addLayer);
        
        if (!layers.length) {
            var layer = new FTLayer;
            layers.add(layer);
        }
        
        this.options = new MapOptions(options);
        this.render();
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
    
    render: function() {
        for (var index in this.options.fieldnames) {
            var field = this.options.fieldnames[index];
            var value = this.options.get(field);
            $('input#map-' + field).val(value);
        };
        
        return this;
    },
    
    render_map: function() {
        $('#map_embed').remove();
        var script = $('<script/>')
            .attr('id', '#map-embed')
            .html( this.jsTemplate({
                options: this.options.toJSON(),
                layers: layers.complete()
            }));
        $('body').append(script);
        return this;
    },
    
    updateOptions: function(options) {
        var changes = {};
        for (var index in this.options.fieldnames) {
            var field = fieldnames[index];
            var value = $('input#map-' + field).val();
            changes[field] = value;
        };
        this.options.set(changes);
        return this;
    }
    
});

window.ft_builder = new AppView({
    height: $('#map_canvas').height(),
    width: $('#map_canvas').width(),
    zoom: 7,
    center: "41.095777,-77.579046"
});

});