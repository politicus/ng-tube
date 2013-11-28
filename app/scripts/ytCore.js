angular.module('ytCore', [])

  .constant('YT_VIDEO_URL',   'https://gdata.youtube.com/feeds/api/videos/{ID}?v=2&alt=json&callback=JSON_CALLBACK')
  .constant('YT_SEARCH_URL',  'https://gdata.youtube.com/feeds/api/videos/?q={Q}&v=2&alt=json&callback=JSON_CALLBACK')
  .constant('YT_POPULAR_URL', 'https://gdata.youtube.com/feeds/api/standardfeeds/{FEED}?alt=json&callback=JSON_CALLBACK')
  .constant('YT_EMBED_URL',   'http://www.youtube.com/embed/{ID}?autoplay=1')

  .factory('ytFeed', ['ytVideos', 'YT_POPULAR_URL',
              function(ytVideos,   YT_POPULAR_URL) {
    return function(feed) {
      var url = YT_POPULAR_URL.replace('{FEED}', feed);
      return ytVideos(url);
    }
  }])

  .factory('ytSearch', ['ytVideos', 'YT_SEARCH_URL',
                function(ytVideos,   YT_SEARCH_URL) {
    return function(q) {
      var url = YT_SEARCH_URL.replace('{Q}', q || '');
      return ytVideos(url);
    }
  }])

  .factory('ytVideos', ['$q', '$http', 'ytVideoPrepare',
                function($q,   $http,   ytVideoPrepare) {
    return function(url) {
      var defer = $q.defer();
      $http.jsonp(url).
        success(function(response) {
          var results = [];
          angular.forEach(response.feed.entry, function(entry) {
            results.push(ytVideoPrepare(entry));
          });
          defer.resolve(results);
        }).
        error(function() {
          return 'failure';
        });
      return defer.promise;
    };
  }])

  .factory('ytVideo', ['$q', '$http', 'ytVideoPrepare', 'YT_VIDEO_URL',
               function($q,   $http,   ytVideoPrepare,   YT_VIDEO_URL) {

    return function(id) {
      var defer = $q.defer();
      var url = YT_VIDEO_URL.replace('{ID}', id);
      $http.jsonp(url).
        success(function(response) {
          defer.resolve(ytVideoPrepare(response.data));
        }).
        error(function() {
          return 'failure';
        });
      return defer.promise;
    };
  }])

  .factory('ytVideoPrepare', ['ytCreateEmbedURL',
                      function(ytCreateEmbedURL) {
    return function(entry) {
      var $media      = entry.media$group;
      var id          = $media.yt$videoid.$t;
      var thumbnails  = [];

      var hqVideo;
      angular.forEach($media.media$thumbnail || [], function(thumb) {
        var image = {
          width : thumb.width,
          height : thumb.height,
          url : thumb.url,
          name : thumb.yt$name
        }
        if(image.name == 'hqdefault') {
          hqVideo = hqVideo || image;
        }
        thumbnails.push(image);
      });

      return {
        id : id,
        image : hqVideo || thumbnails[0],
        thumbnails : thumbnails,
        title : entry.title.$t,
        description : $media.media$description.$t,
        rating : entry.gd$rating ? parseInt(entry.gd$rating.average) : 0,
        keywords : $media.media$keywords || '',
        embedUrl : ytCreateEmbedURL(id)
      };
    };
  }])

  .factory('ytCreateEmbedURL', ['YT_EMBED_URL',
                        function(YT_EMBED_URL) {
    return function(id) {
      return YT_EMBED_URL.replace('{ID}', id);
    }
  }]);
