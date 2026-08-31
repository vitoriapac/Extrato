(function(){
    try{
      var saved=localStorage.getItem('bb-premium-theme');
      var theme=saved==='dark'||saved==='light'
        ? saved
        : (window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
      document.documentElement.setAttribute('data-theme',theme);
    }catch(e){
      document.documentElement.setAttribute('data-theme','light');
    }
  })();
