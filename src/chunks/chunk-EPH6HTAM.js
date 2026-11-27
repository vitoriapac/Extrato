/* Arquivo gerado. Edite os modulos em src/, nao este bundle. */
function e(r){let n=Number(r)||0;return n>0&&n<60?Math.max(1,Math.floor(n))+" s":u(Math.floor(n/60))}function u(r){let n=Math.max(0,Math.round(Number(r)||0));if(n<60)return n+" min";let o=Math.floor(n/60),t=n%60;return o+" h"+(t?" "+t+" min":"")}export{e as a,u as b};
