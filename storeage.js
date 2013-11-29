function Storage() {
  var ls = window.localStorage || null;

  function save() {
  }

  return {
    save: save,
    open: open
  };
}
