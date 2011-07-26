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

var FTLayer = Backbone.Model.extend({
    
    defaults: {
        table_id: null,
        location_column: null,
        filter: null
    }
})

/***
**FTLayer**: 

Stores basic data about a Fusion Table:

 - table_id
 - location_column
 - filter

***/


/***
Views
***/

var LayerView = Backbone.View.extend({
    
    className: ".layer",
    
    events: {
        'change input.table_id': 'setColumns'
    },
    
    setColumns: function() {
        var that = this;
        var table_id = this.$('input.table_id').val();
        if (!table_id) return;
        
        var sql = "SELECT * FROM " + table_id + " LIMIT 1";
        query(sql, function(resp) {
            var columns = resp.table.cols;
            var select = that.$('select.location_column');
            for (var key in columns) {
                var column = columns[key];
                var option = $('<option/>')
                    .attr('value', column)
                    .text(column);
                select.append(option);
            }
            select.focus();
        })
    }
    
});


