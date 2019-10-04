/**
 * Created by owaismushtaq on 03/10/19.
 */

var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    maxZoom: 9,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
});
map = L.map('map', {zoom: 13, layers: [tiles]});
map.on('load', function (e) {
    search()
});
map.setView([22.295006, 78.945313], 3);
map.on('zoomend dragend', function (e) {
    search();
});
markers = L.markerClusterGroup({
    chunkedLoading: true,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    iconCreateFunction: function (cluster) {
        //Grouping the cluster returned by the server, if
        var markers = cluster.getAllChildMarkers();
        var markerCount = 0;
        markers.forEach(function (m) {
            markerCount = markerCount + m.count;
        });

        return new L.DivIcon({html: '<div class=" clustergroup0 leaflet-marker-icon marker-cluster marker-cluster-medium leaflet-zoom-animated leaflet-clickable" tabindex="0" style="margin-left: -20px; margin-top: -20px; width: 40px; height: 40px; z-index: 233;"><div><span>' + markerCount + '</span></div></div>'});
    }
});
map.addLayer(markers);
/* This will add all the clusters as returned by the elastic server.*/
function makePoints(aggs) {
    points = {};

    var markerList = [];
    aggs.forEach(function (agg, index) {
        var center = geohash.decode(agg.key);//elastic return a geohas so need to change it into lat/lon
        var myIcon = L.divIcon({html: '<div class="clustergroup0 leaflet-marker-icon marker-cluster marker-cluster-medium leaflet-zoom-animated leaflet-clickable" tabindex="0" style="margin-left: -20px; margin-top: -20px; width: 40px; height: 40px; z-index: 233;"><div><span>' + agg.doc_count + '</span></div></div>'});
        var marker = L.marker(new L.LatLng(center.latitude, center.longitude), {icon: myIcon});
        marker.count = agg.doc_count;
        marker.sentiment = agg.sentiment_avg.value;
        marker.bindPopup('' + agg.doc_count);
        markerList.push(marker);
    });
    markers.addLayers(markerList);
}
function search() {
    var b = map.getBounds();
    var b1 = {
        "trlat": b.getNorthWest().lat,
        "trlon": b.getNorthWest().lng,
        "bllat": b.getSouthEast().lat,
        "bllon": b.getSouthEast().lng
    }
    //Get the zoom level
    var zoom = 3;
    if (map.getZoom() >= 5 && map.getZoom() <= 8) {
        zoom = 4;
    }
    else if (map.getZoom() >= 9 && map.getZoom() <= 11) {
        zoom = 5;
    }
    else if (map.getZoom() >= 12 && map.getZoom() <= 14) {
        zoom = 6;
    }
    else if (map.getZoom() >= 15 && map.getZoom() <= 17) {
        zoom = 7;
    }
    else if (map.getZoom() >= 18) {
        zoom = 8;
    }
    //making elastic api call via parse visit https://parse.com/
    var d = {
        "bounds": b1,
        "zoom": zoom
    };
    $.ajax({
        method: "GET",
        url: "https://parseapi.back4app.com/functions/search",
        data: JSON.stringify(d),
        dataType: "text",
        headers: {
            "content-type": "application/json",
            "X-Parse-Application-Id": "OjImjwifOD5EladE5585UAS3CJGy7ednZjucd5SE",
            "X-Parse-REST-API-Key": "TC3nNk6nae1COCn0bZJ0XE76KBT4F5eR4Pm3gPWR"
        }
    })
        .done(function (resp) {
            markers.clearLayers();
            var r = JSON.parse(resp)
            r = JSON.parse(r.result)
            makePoints(r.aggregations.zoom.buckets);
        })
        .fail(function (error) {
            console.log(error)
        });
    /*Parse.initialize("OjImjwifOD5EladE5585UAS3CJGy7ednZjucd5SE", "6CE4fybH3Cg4fiqbvxsAE8osmX6MsEIWou0Kudr9");
     Parse.Cloud.run('search', d, {
     success: function(resp) {
     markers.clearLayers();
     var r = JSON.parse(resp)
     //makes the points as returned by the server.
     makePoints(r.aggregations.zoom.buckets);
     },
     error: function(error) {
     console.log(error)
     }
     });*/
}
