 module.exports = {
   match: function(template, key) {
    template = template.split('.');
    key = key.split('.');

    var matches = {};

    for (var id in template) {
      if (id > key.length) {
        return null;
      } else if (template[id][0] == '*') {
        continue
      } else if (template[id][0] == '{' && template[id][template[id].length - 1] == '}') {
        if (template[id][1] == '*') {
          matches[template[id].substring(2, template[id].length - 1)] = key.splice(id);
          break
        }
        matches[template[id].substring(1, template[id].length - 1)] = key[id];
      } else if(key[id] != template[id]) {
        return null;
      }
    }

    return matches;
  }
};
