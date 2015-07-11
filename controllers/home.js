/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
  res.render('home', {
    title: 'Home'
  });
};

exports.browse = function(req, res) {
  res.render('browse', {
    title: 'Browse'
  });
};

exports.task = function(req, res) {
  res.render('task', {
    title: 'Task'
  });
};